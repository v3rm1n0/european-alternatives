<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cache.php';
require_once __DIR__ . '/helpers.php';

requireHttpMethod('GET');

if (!function_exists('matrixBuildInPlaceholders')) {
    function matrixBuildInPlaceholders(array $ids, string $prefix = 'id'): array
    {
        $placeholders = [];
        $params = [];
        foreach (array_values($ids) as $index => $id) {
            $key = ":{$prefix}{$index}";
            $placeholders[] = $key;
            $params[$key] = $id;
        }

        return [implode(',', $placeholders), $params];
    }
}

if (!function_exists('matrixSortRows')) {
    function matrixSortRows(array &$rows, array $keys): void
    {
        usort($rows, static function (array $left, array $right) use ($keys): int {
            foreach ($keys as $key => $direction) {
                $leftValue = $left[$key] ?? null;
                $rightValue = $right[$key] ?? null;

                if (is_numeric($leftValue) && is_numeric($rightValue)) {
                    $comparison = (int)$leftValue <=> (int)$rightValue;
                } else {
                    $comparison = strcmp((string)$leftValue, (string)$rightValue);
                }

                if ($comparison !== 0) {
                    return $direction === 'desc' ? -$comparison : $comparison;
                }
            }

            return 0;
        });
    }
}

if (!function_exists('matrixFactValue')) {
    function matrixFactValue(array $fact, string $valueType): mixed
    {
        return match ($valueType) {
            'boolean' => $fact['value_bool'] === null ? null : (bool)$fact['value_bool'],
            'number' => $fact['value_number'] === null ? null : (float)$fact['value_number'],
            'multi_enum' => matrixJsonArrayValue($fact['value_json'] ?? null),
            default => $fact['value_text'] ?? null,
        };
    }
}

if (!function_exists('matrixJsonArrayValue')) {
    function matrixJsonArrayValue(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (!is_string($value) || trim($value) === '') {
            return [];
        }

        try {
            $decoded = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            return [];
        }

        return is_array($decoded) ? array_values($decoded) : [];
    }
}

if (!function_exists('matrixPublicSource')) {
    function matrixPublicSource(array $fact): ?array
    {
        $url = $fact['public_source_url'] ?? null;
        if (!is_string($url) || $url === '') {
            return null;
        }

        $source = ['url' => $url];

        if (isset($fact['public_source_title']) && $fact['public_source_title'] !== '') {
            $source['title'] = $fact['public_source_title'];
        }

        if (isset($fact['public_source_accessed_date']) && $fact['public_source_accessed_date'] !== '') {
            $source['accessedDate'] = $fact['public_source_accessed_date'];
        }

        return $source;
    }
}

if (!function_exists('matrixPublicFact')) {
    function matrixPublicFact(?array $fact, string $valueType): array
    {
        if ($fact === null) {
            return [
                'status' => 'unverified',
                'value' => null,
            ];
        }

        $status = $fact['status'] ?? 'open';
        if ($status === 'not-applicable') {
            return [
                'status' => 'not_applicable',
                'value' => null,
            ];
        }

        if ($status !== 'verified') {
            return [
                'status' => 'unverified',
                'value' => null,
            ];
        }

        $cell = [
            'status' => 'verified',
            'value' => matrixFactValue($fact, $valueType),
        ];

        $source = matrixPublicSource($fact);
        if ($source !== null) {
            $cell['source'] = $source;
        }

        return $cell;
    }
}

$validLocales = ['en', 'de'];

$rawCategory = $_GET['category'] ?? null;
if ($rawCategory === null || (is_string($rawCategory) && trim($rawCategory) === '')) {
    sendJsonResponse(400, [
        'ok' => false,
        'error' => 'missing_category',
        'detail' => 'Query parameter "category" is required.',
    ]);
}

if (!is_string($rawCategory) || !preg_match('/^[a-zA-Z0-9._-]+$/', $rawCategory)) {
    sendJsonResponse(400, [
        'ok' => false,
        'error' => 'invalid_category',
        'detail' => 'Category contains invalid characters.',
    ]);
}

$category = $rawCategory;
$locale = $_GET['locale'] ?? 'en';

if (!is_string($locale) || !in_array($locale, $validLocales, true)) {
    sendJsonResponse(400, [
        'ok' => false,
        'error' => 'invalid_locale',
        'detail' => 'Allowed values: ' . implode(', ', $validLocales),
    ]);
}

$cacheParams = ['category' => $category, 'locale' => $locale];
serveCachedResponse('matrix', $cacheParams);

try {
    $pdo = getDatabaseConnection();
} catch (Throwable $e) {
    error_log(sprintf('[api][catalog/matrix] DB connection failed: %s', $e->getMessage()));
    sendJsonResponse(500, [
        'ok' => false,
        'error' => 'database_unavailable',
    ]);
}

$categoryNameExpr = $locale === 'de'
    ? "COALESCE(NULLIF(c.name_de, ''), c.name_en)"
    : 'c.name_en';
$categoryDescriptionExpr = $locale === 'de'
    ? "COALESCE(NULLIF(c.description_de, ''), c.description_en)"
    : 'c.description_en';

$groupLabelExpr = $locale === 'de'
    ? "COALESCE(NULLIF(mcg.label_de, ''), mcg.label_en)"
    : 'mcg.label_en';
$groupDescriptionExpr = $locale === 'de'
    ? "COALESCE(NULLIF(mcg.description_de, ''), mcg.description_en)"
    : 'mcg.description_en';

$criterionLabelExpr = $locale === 'de'
    ? "COALESCE(NULLIF(mc.label_de, ''), mc.label_en)"
    : 'mc.label_en';
$criterionHelpExpr = $locale === 'de'
    ? "COALESCE(NULLIF(mc.help_text_de, ''), mc.help_text_en)"
    : 'mc.help_text_en';

$optionLabelExpr = $locale === 'de'
    ? "COALESCE(NULLIF(mco.label_de, ''), mco.label_en)"
    : 'mco.label_en';

try {
    $categorySql = <<<SQL
SELECT
    c.id,
    c.emoji,
    {$categoryNameExpr} AS name,
    {$categoryDescriptionExpr} AS description
FROM categories c
/* FROM CATEGORIES */
WHERE c.id = :id
LIMIT 1
SQL;

    $categoryStmt = $pdo->prepare($categorySql);
    $categoryStmt->execute(['id' => $category]);
    $categoryRow = $categoryStmt->fetch();

    if ($categoryRow === false) {
        sendJsonResponse(400, [
            'ok' => false,
            'error' => 'invalid_category',
            'detail' => 'No category exists for the given id.',
        ]);
    }

    $groupsSql = <<<SQL
SELECT
    mcg.id,
    mcg.group_key,
    {$groupLabelExpr} AS label,
    {$groupDescriptionExpr} AS description,
    mcg.sort_order
FROM matrix_criterion_groups mcg
/* MATRIX_CRITERION_GROUPS */
WHERE mcg.category_id = :category
ORDER BY mcg.sort_order ASC, mcg.id ASC
SQL;

    $groupsStmt = $pdo->prepare($groupsSql);
    $groupsStmt->execute(['category' => $category]);
    $groupRows = $groupsStmt->fetchAll();
    matrixSortRows($groupRows, ['sort_order' => 'asc', 'id' => 'asc']);

    $criteriaSql = <<<SQL
SELECT
    mc.id,
    mc.group_id,
    mc.criterion_key,
    {$criterionLabelExpr} AS label,
    {$criterionHelpExpr} AS help_text,
    mc.value_type,
    mc.semantics,
    mc.filter_mode,
    mc.sort_order
FROM matrix_criteria mc
JOIN matrix_criterion_groups mcg ON mcg.id = mc.group_id
                               AND mcg.category_id = mc.category_id
WHERE mc.category_id = :category
ORDER BY mcg.sort_order ASC, mc.sort_order ASC, mc.id ASC
SQL;

    $criteriaStmt = $pdo->prepare($criteriaSql);
    $criteriaStmt->execute(['category' => $category]);
    $criterionRows = $criteriaStmt->fetchAll();

    $groupSortById = [];
    foreach ($groupRows as $groupRow) {
        $groupSortById[(int)$groupRow['id']] = (int)$groupRow['sort_order'];
    }

    foreach ($criterionRows as &$criterionRow) {
        $criterionRow['_group_sort_order'] = $groupSortById[(int)$criterionRow['group_id']] ?? 0;
    }
    unset($criterionRow);
    matrixSortRows($criterionRows, [
        '_group_sort_order' => 'asc',
        'sort_order' => 'asc',
        'id' => 'asc',
    ]);

    $optionsSql = <<<SQL
SELECT
    mco.id,
    mco.criterion_id,
    mco.option_key,
    {$optionLabelExpr} AS label,
    mco.display_tone,
    mco.sort_order,
    mc.sort_order AS criterion_sort_order
FROM matrix_criterion_options mco
/* MATRIX_CRITERION_OPTIONS */
JOIN matrix_criteria mc ON mc.id = mco.criterion_id
WHERE mc.category_id = :category
ORDER BY mc.sort_order ASC, mco.sort_order ASC, mco.id ASC
SQL;

    $optionsStmt = $pdo->prepare($optionsSql);
    $optionsStmt->execute(['category' => $category]);
    $optionRows = $optionsStmt->fetchAll();

    $criterionSortById = [];
    foreach ($criterionRows as $criterionRow) {
        $criterionSortById[(int)$criterionRow['id']] = (int)$criterionRow['sort_order'];
    }

    foreach ($optionRows as &$optionRow) {
        $optionRow['criterion_sort_order'] = $criterionSortById[(int)$optionRow['criterion_id']] ?? ($optionRow['criterion_sort_order'] ?? 0);
    }
    unset($optionRow);
    matrixSortRows($optionRows, [
        'criterion_sort_order' => 'asc',
        'sort_order' => 'asc',
        'id' => 'asc',
    ]);

    $entriesSql = <<<SQL
SELECT
    ce.id,
    ce.slug,
    ce.name,
    ce.country_code,
    ce.website_url,
    ce.logo_path
FROM catalog_entries ce
/* CATALOG_ENTRIES ENTRY_CATEGORIES */
JOIN entry_categories match_ec ON match_ec.entry_id = ce.id
                              AND match_ec.category_id = :category
WHERE ce.status = 'alternative'
  AND ce.is_active = 1
ORDER BY ce.name ASC, ce.id ASC
SQL;

    $entriesStmt = $pdo->prepare($entriesSql);
    $entriesStmt->execute(['category' => $category]);
    $entryRows = $entriesStmt->fetchAll();
    matrixSortRows($entryRows, ['name' => 'asc', 'id' => 'asc']);

    $entryIds = [];
    foreach ($entryRows as $entryRow) {
        $entryIds[] = (int)$entryRow['id'];
    }

    $membershipsByEntry = [];
    $factsByEntryAndCriterion = [];

    if (count($entryIds) > 0) {
        [$entryInClause, $entryParams] = matrixBuildInPlaceholders($entryIds, 'entry');

        $membershipsSql = <<<SQL
SELECT
    ec.entry_id,
    ec.category_id,
    ec.is_primary,
    ec.sort_order
FROM entry_categories ec
/* ENTRY_CATEGORIES */
WHERE ec.entry_id IN ({$entryInClause})
ORDER BY ec.entry_id ASC, ec.is_primary DESC, ec.sort_order ASC
SQL;

        $membershipsStmt = $pdo->prepare($membershipsSql);
        $membershipsStmt->execute($entryParams);
        $membershipRows = $membershipsStmt->fetchAll();
        matrixSortRows($membershipRows, [
            'entry_id' => 'asc',
            'is_primary' => 'desc',
            'sort_order' => 'asc',
        ]);

        foreach ($membershipRows as $membershipRow) {
            $entryId = (int)$membershipRow['entry_id'];
            $membershipsByEntry[$entryId][] = $membershipRow;
        }

        $factsParams = $entryParams;
        $factsParams['category'] = $category;
        $factsSql = <<<SQL
SELECT
    mf.entry_id,
    mf.status,
    mf.value_bool,
    mf.value_number,
    mf.value_text,
    mf.value_json,
    mf.public_source_url,
    mf.public_source_title,
    mf.public_source_accessed_date,
    mc.criterion_key
FROM matrix_facts mf
/* MATRIX_FACTS */
JOIN matrix_criteria mc ON mc.id = mf.criterion_id
                       AND mc.category_id = mf.category_id
WHERE mf.category_id = :category
  AND mf.entry_id IN ({$entryInClause})
ORDER BY mf.entry_id ASC, mc.sort_order ASC, mf.id ASC
SQL;

        $factsStmt = $pdo->prepare($factsSql);
        $factsStmt->execute($factsParams);
        $factRows = $factsStmt->fetchAll();

        foreach ($factRows as $factRow) {
            $entryId = (int)$factRow['entry_id'];
            $criterionKey = (string)$factRow['criterion_key'];
            $factsByEntryAndCriterion[$entryId][$criterionKey] = $factRow;
        }
    }
} catch (Throwable $e) {
    error_log(sprintf('[api][catalog/matrix] Query failed: %s', $e->getMessage()));
    sendJsonResponse(500, [
        'ok' => false,
        'error' => 'query_failed',
    ]);
}

$groups = [];
$groupIndexById = [];
foreach ($groupRows as $groupRow) {
    $groupIndexById[(int)$groupRow['id']] = count($groups);
    $groups[] = [
        'id' => $groupRow['group_key'],
        'label' => $groupRow['label'],
        'description' => $groupRow['description'] ?? null,
        'criteria' => [],
    ];
}

$criteriaById = [];
$criterionKeys = [];
$criterionValueTypes = [];
foreach ($criterionRows as $criterionRow) {
    $criterionId = (int)$criterionRow['id'];
    $criterionKey = (string)$criterionRow['criterion_key'];
    $criterionKeys[] = $criterionKey;
    $criterionValueTypes[$criterionKey] = (string)$criterionRow['value_type'];
    $criteriaById[$criterionId] = [
        'groupId' => (int)$criterionRow['group_id'],
        'criterion' => [
            'id' => $criterionKey,
            'label' => $criterionRow['label'],
            'helpText' => $criterionRow['help_text'] ?? null,
            'valueType' => $criterionRow['value_type'],
            'semantics' => $criterionRow['semantics'],
            'filterMode' => $criterionRow['filter_mode'],
            'options' => [],
        ],
    ];
}

foreach ($optionRows as $optionRow) {
    $criterionId = (int)$optionRow['criterion_id'];
    if (!isset($criteriaById[$criterionId])) {
        continue;
    }

    $option = [
        'id' => $optionRow['option_key'],
        'label' => $optionRow['label'],
    ];

    if (array_key_exists('display_tone', $optionRow) && $optionRow['display_tone'] !== null) {
        $option['displayTone'] = $optionRow['display_tone'];
    }

    $criteriaById[$criterionId]['criterion']['options'][] = $option;
}

foreach ($criteriaById as $criterionData) {
    $groupId = $criterionData['groupId'];
    if (!isset($groupIndexById[$groupId])) {
        continue;
    }

    $groups[$groupIndexById[$groupId]]['criteria'][] = $criterionData['criterion'];
}

$alternatives = [];
foreach ($entryRows as $entryRow) {
    $entryId = (int)$entryRow['id'];
    $primaryCategory = null;
    $secondaryCategories = [];

    foreach ($membershipsByEntry[$entryId] ?? [] as $membershipRow) {
        $categoryId = (string)$membershipRow['category_id'];
        if ((bool)$membershipRow['is_primary'] && $primaryCategory === null) {
            $primaryCategory = $categoryId;
            continue;
        }

        $secondaryCategories[] = $categoryId;
    }

    $facts = [];
    foreach ($criterionKeys as $criterionKey) {
        $fact = $factsByEntryAndCriterion[$entryId][$criterionKey] ?? null;
        $facts[$criterionKey] = matrixPublicFact($fact, $criterionValueTypes[$criterionKey]);
    }

    $alternatives[] = [
        'id' => $entryRow['slug'],
        'name' => $entryRow['name'],
        'website' => $entryRow['website_url'] ?? null,
        'logo' => $entryRow['logo_path'] ?? null,
        'country' => $entryRow['country_code'] ?? null,
        'category' => $primaryCategory,
        'secondaryCategories' => $secondaryCategories,
        'facts' => $facts,
    ];
}

sendCacheableJsonResponse('matrix', $cacheParams, [
    'data' => [
        'category' => [
            'id' => $categoryRow['id'],
            'name' => $categoryRow['name'],
            'description' => $categoryRow['description'],
            'emoji' => $categoryRow['emoji'] ?? null,
        ],
        'groups' => $groups,
        'alternatives' => $alternatives,
    ],
    'meta' => [
        'category' => $category,
        'locale' => $locale,
        'groupCount' => count($groups),
        'criterionCount' => count($criterionRows),
        'alternativeCount' => count($alternatives),
    ],
]);
