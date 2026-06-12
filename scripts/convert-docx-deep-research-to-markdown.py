#!/usr/bin/env python3
"""Convert DOCX deep-research documents into Markdown.

The scoring pipeline consumes Markdown files and checks that cited source_url
values appear verbatim in the document. This converter reads DOCX XML directly
so hyperlink relationship targets are preserved as Markdown link URLs.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import posixpath
import re
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse
from xml.etree import ElementTree as ET


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

URL_RE = re.compile(r"https?://[^\s<>\]\)\"']+", re.IGNORECASE)
HYPERLINK_FIELD_RE = re.compile(
    r'HYPERLINK\s+(?:"([^"]+)"|([^\s\\]+))',
    re.IGNORECASE,
)


def q(namespace: str, local_name: str) -> str:
    return f"{{{namespace}}}{local_name}"


def local_name(tag: str) -> str:
    if tag.startswith("{"):
        return tag.rsplit("}", 1)[1]
    return tag


def attr(element: ET.Element, namespace: str, local: str) -> str | None:
    return element.attrib.get(q(namespace, local))


def collapse_blank_lines(lines: Iterable[str]) -> list[str]:
    output: list[str] = []
    blank = False
    for line in lines:
        cleaned = line.rstrip()
        if cleaned == "":
            if not blank and output:
                output.append("")
            blank = True
            continue
        output.append(cleaned)
        blank = False
    while output and output[-1] == "":
        output.pop()
    return output


def normalize_space(value: str) -> str:
    return value.replace("\xa0", " ").replace("\u202f", " ")


def escape_markdown_link_text(text: str) -> str:
    return text.replace("\n", " ").replace("[", "\\[").replace("]", "\\]")


def markdown_link(text: str, url: str) -> str:
    label = normalize_space(text).strip() or url
    target = url.strip()
    if label == target:
        return target
    return f"[{escape_markdown_link_text(label)}](<{target}>)"


def escape_table_cell(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", "<br>")


def slugify(value: str) -> str:
    slug = value.lower()
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"[^a-z0-9.\-]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    return slug.strip("-") or "document"


def normalized_key(value: str) -> str:
    value = value.lower().replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "", value)


def product_name_from_filename(path: Path) -> str:
    name = path.stem.strip()
    replacements = [
        (r"^Vendor Trust and Ethics Audit of\s+", ""),
        (r"^Full Trust Audit of\s+", ""),
        (r"\s+360[°]?\s+Vendor Trust and Ethics Audit$", ""),
        (r"\s+Vendor Trust and Ethics Audit$", ""),
        (r"\s+Trust and Ethics Audit$", ""),
        (r"\s+Audit$", ""),
    ]
    for pattern, replacement in replacements:
        name = re.sub(pattern, replacement, name, flags=re.IGNORECASE).strip()
    return name or path.stem


def normalize_host(value: str | None) -> str | None:
    if not value:
        return None
    try:
        parsed = urlparse(value if "://" in value else f"https://{value}")
    except ValueError:
        return None
    host = parsed.netloc or parsed.path.split("/", 1)[0]
    host = host.lower().strip()
    if host.startswith("www."):
        host = host[4:]
    return host or None


@dataclass(frozen=True)
class CatalogEntry:
    slug: str
    name: str
    status: str | None
    website: str | None

    @property
    def name_key(self) -> str:
        return normalized_key(self.name)

    @property
    def slug_key(self) -> str:
        return normalized_key(self.slug)

    @property
    def host(self) -> str | None:
        return normalize_host(self.website)


def load_catalog_entries(path: Path | None) -> list[CatalogEntry]:
    if path is None:
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    raw_entries = payload.get("entries", []) if isinstance(payload, dict) else []
    entries: list[CatalogEntry] = []
    for raw in raw_entries:
        if not isinstance(raw, dict):
            continue
        slug = raw.get("slug")
        name = raw.get("name")
        if not isinstance(slug, str) or not slug:
            continue
        if not isinstance(name, str) or not name:
            name = slug
        website = raw.get("website") or raw.get("website_url")
        entries.append(
            CatalogEntry(
                slug=slug,
                name=name,
                status=raw.get("status") if isinstance(raw.get("status"), str) else None,
                website=website if isinstance(website, str) else None,
            )
        )
    return entries


def find_urls(markdown: str) -> list[str]:
    urls = []
    seen = set()
    for match in URL_RE.finditer(markdown):
        url = match.group(0).rstrip(".,;:")
        if url not in seen:
            seen.add(url)
            urls.append(url)
    return urls


def match_catalog_entry(
    *,
    source_path: Path,
    markdown: str,
    entries: list[CatalogEntry],
    include_non_alternatives: bool,
) -> tuple[CatalogEntry | None, str | None, list[str]]:
    if not entries:
        return None, None, []

    candidates = entries if include_non_alternatives else [
        entry for entry in entries if entry.status in (None, "alternative")
    ]

    product = product_name_from_filename(source_path)
    product_key = normalized_key(product)

    exact = [
        entry
        for entry in candidates
        if product_key in {entry.name_key, entry.slug_key}
    ]
    if len(exact) == 1:
        return exact[0], "filename", []

    loose = [
        entry
        for entry in candidates
        if product_key
        and (
            product_key == entry.name_key
            or product_key == entry.slug_key
            or (len(product_key) >= 5 and product_key in entry.name_key)
            or (len(entry.name_key) >= 5 and entry.name_key in product_key)
        )
    ]
    if len(loose) == 1:
        return loose[0], "filename_loose", []

    document_hosts = {
        host
        for url in find_urls(markdown)
        if (host := normalize_host(url)) is not None
    }
    host_matches = [
        entry for entry in candidates if entry.host is not None and entry.host in document_hosts
    ]
    if len(host_matches) == 1:
        return host_matches[0], "website_url", []

    ambiguous = sorted({entry.slug for entry in exact + loose + host_matches})
    return None, "ambiguous" if ambiguous else None, ambiguous


class DocxMarkdownConverter:
    def __init__(self, archive: zipfile.ZipFile) -> None:
        self.archive = archive

    def read_part(self, part_name: str) -> ET.Element | None:
        try:
            data = self.archive.read(part_name)
        except KeyError:
            return None
        return ET.fromstring(data)

    def relationships_for(self, part_name: str) -> dict[str, str]:
        rels_name = posixpath.join(
            posixpath.dirname(part_name),
            "_rels",
            f"{posixpath.basename(part_name)}.rels",
        )
        try:
            data = self.archive.read(rels_name)
        except KeyError:
            return {}

        root = ET.fromstring(data)
        rels: dict[str, str] = {}
        base_dir = posixpath.dirname(part_name)
        for rel in root.findall(q(REL_NS, "Relationship")):
            rel_id = rel.attrib.get("Id")
            target = rel.attrib.get("Target")
            if not rel_id or not target:
                continue
            mode = rel.attrib.get("TargetMode")
            if mode == "External" or re.match(r"^[a-z][a-z0-9+.-]*:", target, re.IGNORECASE):
                rels[rel_id] = target
            else:
                rels[rel_id] = posixpath.normpath(posixpath.join(base_dir, target))
        return rels

    def run_display_text(self, run: ET.Element) -> str:
        parts: list[str] = []

        def walk(node: ET.Element) -> None:
            name = local_name(node.tag)
            if name in {"t", "delText"}:
                parts.append(node.text or "")
                return
            if name == "tab":
                parts.append("\t")
                return
            if name in {"br", "cr"}:
                parts.append("\n")
                return
            if name == "noBreakHyphen":
                parts.append("-")
                return
            if name == "softHyphen":
                return
            if name == "instrText":
                return
            for child in list(node):
                walk(child)

        walk(run)
        return normalize_space("".join(parts))

    def run_instruction_text(self, run: ET.Element) -> str:
        chunks = []
        for node in run.iter(q(W_NS, "instrText")):
            chunks.append(node.text or "")
        return "".join(chunks)

    def hyperlink_text(self, hyperlink: ET.Element, rels: dict[str, str]) -> str:
        text = "".join(
            self.run_display_text(run)
            for run in hyperlink.iter(q(W_NS, "r"))
        )
        rel_id = attr(hyperlink, R_NS, "id")
        url = rels.get(rel_id) if rel_id is not None else None
        if url is None:
            return text
        return markdown_link(text, url)

    def flush_field_link(
        self,
        parts: list[str],
        field_url: str | None,
        field_parts: list[str],
    ) -> tuple[None, list[str]]:
        if field_url is not None:
            parts.append(markdown_link("".join(field_parts), field_url))
        return None, []

    def paragraph_text(self, paragraph: ET.Element, rels: dict[str, str]) -> str:
        parts: list[str] = []
        pending_field_url: str | None = None
        field_url: str | None = None
        field_parts: list[str] = []

        for child in list(paragraph):
            name = local_name(child.tag)
            if name == "hyperlink":
                field_url, field_parts = self.flush_field_link(parts, field_url, field_parts)
                parts.append(self.hyperlink_text(child, rels))
                continue
            if name != "r":
                continue

            instruction = self.run_instruction_text(child)
            if instruction:
                match = HYPERLINK_FIELD_RE.search(instruction)
                if match is not None:
                    pending_field_url = match.group(1) or match.group(2)
                continue

            field_chars = child.findall(q(W_NS, "fldChar"))
            handled_field_char = False
            for field_char in field_chars:
                field_type = attr(field_char, W_NS, "fldCharType")
                if field_type == "begin":
                    pending_field_url = None
                    handled_field_char = True
                elif field_type == "separate":
                    if pending_field_url is not None:
                        field_url = pending_field_url
                        field_parts = []
                        pending_field_url = None
                    handled_field_char = True
                elif field_type == "end":
                    field_url, field_parts = self.flush_field_link(parts, field_url, field_parts)
                    pending_field_url = None
                    handled_field_char = True
            if handled_field_char:
                continue

            text = self.run_display_text(child)
            if field_url is not None:
                field_parts.append(text)
            else:
                parts.append(text)

        field_url, field_parts = self.flush_field_link(parts, field_url, field_parts)
        return "".join(parts).strip()

    def paragraph_style(self, paragraph: ET.Element) -> str | None:
        style = paragraph.find(f"./{q(W_NS, 'pPr')}/{q(W_NS, 'pStyle')}")
        return attr(style, W_NS, "val") if style is not None else None

    def list_prefix(self, paragraph: ET.Element) -> str | None:
        num_pr = paragraph.find(f"./{q(W_NS, 'pPr')}/{q(W_NS, 'numPr')}")
        if num_pr is None:
            return None
        level_el = num_pr.find(q(W_NS, "ilvl"))
        try:
            level = int(attr(level_el, W_NS, "val") or "0") if level_el is not None else 0
        except ValueError:
            level = 0
        return f"{'  ' * max(level, 0)}- "

    def render_paragraph(self, paragraph: ET.Element, rels: dict[str, str]) -> str:
        text = self.paragraph_text(paragraph, rels)
        if text == "":
            return ""

        style = self.paragraph_style(paragraph)
        if style is not None:
            normalized_style = style.lower().replace(" ", "")
            heading_match = re.match(r"heading([1-6])$", normalized_style)
            if heading_match:
                return f"{'#' * int(heading_match.group(1))} {text}"
            if normalized_style == "title":
                return f"# {text}"
            if normalized_style == "subtitle":
                return f"_{text}_"

        prefix = self.list_prefix(paragraph)
        if prefix is not None:
            return f"{prefix}{text}"

        return text

    def table_cell_text(self, cell: ET.Element, rels: dict[str, str]) -> str:
        chunks: list[str] = []
        for child in list(cell):
            name = local_name(child.tag)
            if name == "p":
                rendered = self.render_paragraph(child, rels).strip()
                if rendered:
                    chunks.append(rendered)
            elif name == "tbl":
                chunks.extend(self.render_table(child, rels))
        return "<br>".join(chunks)

    def render_table(self, table: ET.Element, rels: dict[str, str]) -> list[str]:
        rows: list[list[str]] = []
        for row in table.findall(q(W_NS, "tr")):
            cells = [
                self.table_cell_text(cell, rels)
                for cell in row.findall(q(W_NS, "tc"))
            ]
            if cells:
                rows.append(cells)
        if not rows:
            return []

        column_count = max(len(row) for row in rows)
        normalized_rows = [
            row + [""] * (column_count - len(row))
            for row in rows
        ]
        lines = [
            "| " + " | ".join(escape_table_cell(cell) for cell in normalized_rows[0]) + " |",
            "| " + " | ".join("---" for _ in range(column_count)) + " |",
        ]
        for row in normalized_rows[1:]:
            lines.append("| " + " | ".join(escape_table_cell(cell) for cell in row) + " |")
        return lines

    def render_children(self, parent: ET.Element, rels: dict[str, str]) -> list[str]:
        lines: list[str] = []
        for child in list(parent):
            name = local_name(child.tag)
            if name == "p":
                lines.append(self.render_paragraph(child, rels))
                lines.append("")
            elif name == "tbl":
                lines.extend(self.render_table(child, rels))
                lines.append("")
        return lines

    def render_document(self) -> tuple[str, dict[str, int]]:
        root = self.read_part("word/document.xml")
        if root is None:
            raise ValueError("DOCX does not contain word/document.xml")
        body = root.find(q(W_NS, "body"))
        if body is None:
            raise ValueError("DOCX document body is missing")

        document_rels = self.relationships_for("word/document.xml")
        lines = self.render_children(body, document_rels)

        appendix_sections = [
            ("Footnotes", "word/footnotes.xml", "footnote"),
            ("Endnotes", "word/endnotes.xml", "endnote"),
            ("Comments", "word/comments.xml", "comment"),
        ]
        for heading, part_name, element_name in appendix_sections:
            appendix = self.render_appendix(part_name, element_name)
            if appendix:
                lines.append(f"## {heading}")
                lines.append("")
                lines.extend(appendix)
                lines.append("")

        rendered = "\n".join(collapse_blank_lines(lines)) + "\n"
        stats = {
            "chars": len(rendered),
            "source_url_count": len(find_urls(rendered)),
        }
        return rendered, stats

    def render_appendix(self, part_name: str, element_name: str) -> list[str]:
        root = self.read_part(part_name)
        if root is None:
            return []
        rels = self.relationships_for(part_name)
        lines: list[str] = []
        for element in root.findall(q(W_NS, element_name)):
            element_type = attr(element, W_NS, "type")
            if element_type in {"separator", "continuationSeparator"}:
                continue
            element_id = attr(element, W_NS, "id") or "?"
            content = " ".join(
                rendered
                for child in list(element)
                if local_name(child.tag) == "p"
                and (rendered := self.render_paragraph(child, rels).strip())
            )
            if content:
                lines.append(f"- {element_id}: {content}")
        return lines


def convert_docx(path: Path) -> tuple[str, dict[str, int]]:
    with zipfile.ZipFile(path) as archive:
        return DocxMarkdownConverter(archive).render_document()


def discover_docx_files(input_dir: Path, output_dir: Path, recursive: bool) -> list[Path]:
    pattern = "**/*.docx" if recursive else "*.docx"
    files = []
    resolved_output = output_dir.resolve()
    for path in input_dir.glob(pattern):
        if not path.is_file():
            continue
        if path.name.startswith("~$"):
            continue
        try:
            path.resolve().relative_to(resolved_output)
            continue
        except ValueError:
            pass
        files.append(path)
    return sorted(files)


def build_frontmatter(
    *,
    source_path: Path,
    input_dir: Path,
    entry: CatalogEntry | None,
    matched_via: str | None,
) -> str:
    lines = ["---"]
    if entry is not None:
        lines.append(f"entry_slug: {json.dumps(entry.slug)}")
        lines.append(f"entry_name: {json.dumps(entry.name)}")
        if matched_via is not None:
            lines.append(f"matched_via: {json.dumps(matched_via)}")
    try:
        source_relative = source_path.relative_to(input_dir)
    except ValueError:
        source_relative = source_path
    lines.append(f"source_docx: {json.dumps(str(source_relative))}")
    lines.append(f"converted_at: {json.dumps(_dt.datetime.now(_dt.UTC).isoformat())}")
    lines.append("---")
    lines.append("")
    return "\n".join(lines)


def output_path_for(
    *,
    source_path: Path,
    output_dir: Path,
    entry: CatalogEntry | None,
    used_names: set[str],
) -> Path:
    base = entry.slug if entry is not None else slugify(product_name_from_filename(source_path))
    candidate = f"{base}.md"
    index = 2
    while candidate in used_names:
        candidate = f"{base}-{index}.md"
        index += 1
    used_names.add(candidate)
    return output_dir / candidate


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert DOCX deep-research files to Markdown for the trust-scoring pipeline.",
    )
    parser.add_argument("--input-dir", default=str(Path.home() / "Downloads"))
    parser.add_argument("--output-dir", default=str(Path.home() / "Downloads" / "Markdown"))
    parser.add_argument("--catalog-snapshot-file")
    parser.add_argument("--non-recursive", action="store_true")
    parser.add_argument("--include-non-alternatives", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    input_dir = Path(args.input_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    snapshot_path = (
        Path(args.catalog_snapshot_file).expanduser().resolve()
        if args.catalog_snapshot_file
        else None
    )

    if not input_dir.is_dir():
        print(f"error: --input-dir is not a directory: {input_dir}", file=sys.stderr)
        return 64

    entries = load_catalog_entries(snapshot_path)
    docx_files = discover_docx_files(
        input_dir,
        output_dir,
        recursive=not args.non_recursive,
    )

    if not args.dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "inputDir": str(input_dir),
        "outputDir": str(output_dir),
        "catalogSnapshotFile": str(snapshot_path) if snapshot_path else None,
        "discovered": len(docx_files),
        "converted": 0,
        "skippedExisting": 0,
        "failed": 0,
        "documents": [],
    }

    used_names: set[str] = set()
    for source_path in docx_files:
        record: dict[str, object] = {
            "sourceDocx": str(source_path),
            "status": "failed",
        }
        try:
            markdown, stats = convert_docx(source_path)
            entry, matched_via, ambiguous = match_catalog_entry(
                source_path=source_path,
                markdown=markdown,
                entries=entries,
                include_non_alternatives=args.include_non_alternatives,
            )
            output_path = output_path_for(
                source_path=source_path,
                output_dir=output_dir,
                entry=entry,
                used_names=used_names,
            )
            record.update(
                {
                    "outputMarkdown": str(output_path),
                    "entrySlug": entry.slug if entry else None,
                    "entryName": entry.name if entry else None,
                    "matchedVia": matched_via,
                    "ambiguousCandidates": ambiguous,
                    **stats,
                }
            )

            if output_path.exists() and not args.overwrite:
                record["status"] = "skipped_existing"
                report["skippedExisting"] += 1
                report["documents"].append(record)
                continue

            final_markdown = build_frontmatter(
                source_path=source_path,
                input_dir=input_dir,
                entry=entry,
                matched_via=matched_via,
            ) + markdown

            if not args.dry_run:
                output_path.write_text(final_markdown, encoding="utf-8")

            record["status"] = "converted" if not args.dry_run else "dry_run"
            report["converted"] += 1
        except Exception as exc:  # noqa: BLE001 - operator report should keep going.
            report["failed"] += 1
            record["error"] = str(exc)
        report["documents"].append(record)

    report_path = output_dir / "conversion-report.json"
    if not args.dry_run:
        report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 1 if report["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
