import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ResultMode } from "../types";

interface ResultModeSwitchProps {
  mode: ResultMode;
  onChange: (mode: ResultMode) => void;
  matrixAvailable: boolean;
}

const MODE_ORDER: ResultMode[] = ["browse", "matrix"];

export default function ResultModeSwitch({
  mode,
  onChange,
  matrixAvailable,
}: ResultModeSwitchProps) {
  const { t } = useTranslation(["browse"]);
  const buttonRefs = useRef<Record<ResultMode, HTMLButtonElement | null>>({
    browse: null,
    matrix: null,
  });

  const focusMode = useCallback((next: ResultMode) => {
    const target = buttonRefs.current[next];
    if (target) {
      target.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, current: ResultMode) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        const currentIndex = MODE_ORDER.indexOf(current);
        const nextIndex = (currentIndex + 1) % MODE_ORDER.length;
        const next = MODE_ORDER[nextIndex];
        onChange(next);
        focusMode(next);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const currentIndex = MODE_ORDER.indexOf(current);
        const nextIndex =
          (currentIndex - 1 + MODE_ORDER.length) % MODE_ORDER.length;
        const next = MODE_ORDER[nextIndex];
        onChange(next);
        focusMode(next);
      } else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        onChange(current);
      }
    },
    [onChange, focusMode],
  );

  if (!matrixAvailable) {
    return null;
  }

  return (
    <div
      className="result-mode-switch"
      role="radiogroup"
      aria-label={t("browse:resultMode.label")}
    >
      {MODE_ORDER.map((option) => {
        const isActive = mode === option;
        return (
          <button
            key={option}
            ref={(node) => {
              buttonRefs.current[option] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isActive ? "true" : "false"}
            tabIndex={isActive ? 0 : -1}
            className={`result-mode-switch-button${isActive ? " active" : ""}`}
            onClick={() => onChange(option)}
            onKeyDown={(event) => handleKeyDown(event, option)}
          >
            {t(`browse:resultMode.${option}`)}
          </button>
        );
      })}
    </div>
  );
}
