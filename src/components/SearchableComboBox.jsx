import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./SearchableComboBox.css";

function normalize(str) {
  return String(str ?? "")
    .trim()
    .toLowerCase();
}

function toOption(o) {
  if (typeof o === "string") return { label: o, value: o };
  if (o && typeof o === "object") {
    const label = o.label ?? o.value ?? "";
    const val = o.value ?? o.label ?? "";
    return { label: String(label), value: String(val) };
  }
  return null;
}

/**
 * Searchable combobox: type to filter, keyboard nav, light popover aligned with TasDoneNa :root.
 * - pinnedOptions: shown first (e.g. default KRAs), then optional otherOptions (e.g. from API).
 */
export default function SearchableComboBox({
  id,
  name,
  value,
  onChange,
  pinnedOptions = [],
  otherOptions = [],
  placeholder = "",
  disabled = false,
  invalid = false,
  allowCustomValue = true,
  className = "",
  menuMaxHeight = 240,
  /** Prefer below the input (like form-select); flips above if there is not enough viewport space. */
  placement = "bottom",
  /** Native required (use with explicit submit validation for trimmed non-empty). */
  required = false,
}) {
  const autoId = useId();
  const inputId = id ?? `${name ?? "combobox"}-${autoId}`;
  const listboxId = `${inputId}-listbox`;

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const prevOpenRef = useRef(false);
  const blurValidateTimerRef = useRef(null);
  /** Always latest draft / value / allowed set — blur timers must not use stale render closures. */
  const draftRef = useRef(value ?? "");
  const valueRef = useRef(value ?? "");
  const allowedValuesSetRef = useRef(new Set());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({});
  /** Shown after blur when value must be from list only and draft was invalid. */
  const [blurInvalid, setBlurInvalid] = useState(false);

  // Keep draft in sync with the controlled `value` only when `value` changes.
  // Do NOT also key off `open`: when the menu closes after a selection, `open`
  // can flip false before the parent re-renders with the new value, and
  // `setDraft(value)` would briefly (or stuck) restore the *previous* selection.
  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  useEffect(() => {
    draftRef.current = draft ?? "";
  }, [draft]);

  useEffect(() => {
    valueRef.current = value ?? "";
  }, [value]);

  const pinned = useMemo(() => {
    const raw = Array.isArray(pinnedOptions) ? pinnedOptions : [];
    return raw.map(toOption).filter(Boolean);
  }, [pinnedOptions]);

  const other = useMemo(() => {
    const raw = Array.isArray(otherOptions) ? otherOptions : [];
    return raw.map(toOption).filter(Boolean);
  }, [otherOptions]);

  const q = normalize(open ? draft : "");

  const filteredPinned = useMemo(() => {
    if (!q) return pinned;
    return pinned.filter((o) => normalize(o.label).includes(q));
  }, [pinned, q]);

  const pinnedValues = useMemo(() => new Set(pinned.map((o) => o.value)), [pinned]);

  const filteredOther = useMemo(() => {
    const rest = other.filter((o) => !pinnedValues.has(o.value));
    if (!q) return rest;
    return rest.filter((o) => normalize(o.label).includes(q));
  }, [other, pinnedValues, q]);

  /** Exact strings allowed: all options plus current committed value (legacy / not yet in suggestions). */
  const allowedValuesSet = useMemo(() => {
    const s = new Set();
    pinned.forEach((o) => s.add(o.value));
    other.forEach((o) => s.add(o.value));
    const v = (value ?? "").trim();
    if (v) s.add(v);
    return s;
  }, [pinned, other, value]);

  useEffect(() => {
    allowedValuesSetRef.current = allowedValuesSet;
  }, [allowedValuesSet]);

  const flatList = useMemo(() => {
    const list = [];
    filteredPinned.forEach((o) => list.push({ ...o, section: "pinned" }));
    if (filteredPinned.length && filteredOther.length) {
      list.push({ type: "sep" });
    }
    filteredOther.forEach((o) => list.push({ ...o, section: "other" }));
    return list;
  }, [filteredPinned, filteredOther]);

  const selectableIndices = useMemo(
    () => flatList.map((item, i) => (item.type === "sep" ? -1 : i)).filter((i) => i >= 0),
    [flatList]
  );

  const getSelectableAt = useCallback(
    (orderIndex) => {
      if (orderIndex < 0 || orderIndex >= selectableIndices.length) return null;
      const idx = selectableIndices[orderIndex];
      return flatList[idx];
    },
    [flatList, selectableIndices]
  );

  const findOrderIndex = useCallback(
    (flatIndex) => selectableIndices.indexOf(flatIndex),
    [selectableIndices]
  );

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!rootRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    return () => {
      if (blurValidateTimerRef.current) window.clearTimeout(blurValidateTimerRef.current);
    };
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!open || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const gap = 6;
    const margin = 8;
    const width = Math.max(rect.width, 200);
    let left = rect.left;
    if (left + width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - width - margin);
    }

    const menuEl = menuRef.current;
    const menuH = menuEl ? menuEl.getBoundingClientRect().height : 0;

    let top;
    if (placement === "top") {
      top = rect.top - (menuH || 0) - gap;
      if (top < margin || menuH === 0) {
        top = rect.bottom + gap;
      }
    } else {
      top = rect.bottom + gap;
      if (menuH > 0 && top + menuH > window.innerHeight - margin) {
        const above = rect.top - menuH - gap;
        if (above >= margin) {
          top = above;
        } else {
          top = Math.max(margin, window.innerHeight - menuH - margin);
        }
      }
    }

    setMenuStyle({
      position: "fixed",
      left,
      top,
      width,
      maxHeight: menuMaxHeight,
      zIndex: 100000,
    });
  }, [open, menuMaxHeight, placement]);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const idRaf = requestAnimationFrame(() => updateMenuPosition());
    return () => cancelAnimationFrame(idRaf);
  }, [open, flatList.length, menuMaxHeight, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onWin = () => updateMenuPosition();
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);
    return () => {
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setActiveIndex(selectableIndices.length ? 0 : -1);
    }
    prevOpenRef.current = open;
  }, [open, selectableIndices.length]);

  const commitDraft = useCallback(() => {
    const v = (draft ?? "").trim();
    onChange?.(v);
  }, [draft, onChange]);

  /** Read refs so delayed blur validation never re-applies a *previous* KRA after a new pick. */
  const runRestrictedBlurValidate = useCallback(() => {
    const t = (draftRef.current ?? "").trim();
    const committed = (valueRef.current ?? "").trim();
    const allowed = allowedValuesSetRef.current;
    if (allowed.has(t)) {
      if (t !== committed) onChange?.(t);
      setDraft(t);
      setBlurInvalid(false);
    } else {
      setDraft(valueRef.current ?? "");
      setBlurInvalid(t.length > 0);
    }
  }, [onChange]);

  const selectOption = useCallback(
    (opt) => {
      if (!opt || opt.type === "sep") return;
      if (blurValidateTimerRef.current) {
        window.clearTimeout(blurValidateTimerRef.current);
        blurValidateTimerRef.current = null;
      }
      setBlurInvalid(false);
      const next = opt.value;
      draftRef.current = next;
      onChange?.(next);
      setDraft(next);
      setOpen(false);
      setActiveIndex(-1);
      // Do not call input.blur() here: it fires onBlur → a 120ms timer that used to run with a
      // *stale* draft closure and revert the selection to the previous KRA. Focus stays in the
      // field; mousedown preventDefault on options already avoids stealing focus.
    },
    [onChange]
  );

  const noResults =
    open && q.length > 0 && filteredPinned.length === 0 && filteredOther.length === 0;
  const listInvalid = !allowCustomValue && noResults && q.length > 0;
  const propInvalid = Boolean(invalid);
  const showInvalidStyle = listInvalid || blurInvalid || propInvalid;

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => {
        const max = selectableIndices.length - 1;
        if (max < 0) return -1;
        if (i < 0) return 0;
        return Math.min(i + 1, max);
      });
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => {
        const max = selectableIndices.length - 1;
        if (max < 0) return -1;
        if (i <= 0) return 0;
        return Math.max(i - 1, 0);
      });
      return;
    }
    if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const opt = getSelectableAt(activeIndex);
      if (opt) selectOption(opt);
      else if (allowCustomValue) {
        commitDraft();
        setOpen(false);
      } else {
        const combined = [...filteredPinned, ...filteredOther];
        const exact = combined.find((o) => normalize(o.value) === normalize(draft));
        if (exact) selectOption(exact);
        else if (combined.length === 1) selectOption(combined[0]);
      }
      return;
    }
    if (e.key === "Escape") {
      if (!open) return;
      e.preventDefault();
      setOpen(false);
      setDraft(value ?? "");
      setBlurInvalid(false);
      setActiveIndex(-1);
    }
  };

  const activeFlatIndex =
    activeIndex >= 0 && activeIndex < selectableIndices.length ? selectableIndices[activeIndex] : -1;

  const menuContent =
    open &&
    createPortal(
      <div
        ref={menuRef}
        id={listboxId}
        className="searchable-combobox-menu"
        role="listbox"
        style={menuStyle}
      >
        {noResults ? (
          <div className="searchable-combobox-empty">No option matching &quot;{draft.trim()}&quot;</div>
        ) : (
          flatList.map((item, idx) => {
            if (item.type === "sep") {
              return <div key={`sep-${idx}`} className="searchable-combobox-sep" role="separator" />;
            }
            const active = idx === activeFlatIndex;
            return (
              <button
                key={`${item.value}-${idx}`}
                type="button"
                role="option"
                aria-selected={active}
                className={`searchable-combobox-option${active ? " is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(findOrderIndex(idx))}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(item);
                }}
              >
                <span className="searchable-combobox-option-label">{item.label}</span>
              </button>
            );
          })
        )}
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className={`searchable-combobox-root${className ? ` ${className}` : ""}`}>
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="text"
        className={`form-control searchable-combobox-input${showInvalidStyle ? " is-invalid" : ""}`}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        required={required}
        aria-required={required ? "true" : undefined}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        role="combobox"
        value={draft}
        onFocus={() => {
          if (disabled) return;
          if (blurValidateTimerRef.current) {
            window.clearTimeout(blurValidateTimerRef.current);
            blurValidateTimerRef.current = null;
          }
          setBlurInvalid(false);
          setOpen(true);
          setDraft((d) => (d !== "" && d != null ? d : value ?? ""));
        }}
        onChange={(e) => {
          if (disabled) return;
          const v = e.target.value;
          setDraft(v);
          setOpen(true);
          setBlurInvalid(false);
          if (allowCustomValue) onChange?.(v);
        }}
        onBlur={() => {
          if (allowCustomValue) {
            commitDraft();
            return;
          }
          blurValidateTimerRef.current = window.setTimeout(() => {
            blurValidateTimerRef.current = null;
            if (rootRef.current?.contains(document.activeElement)) return;
            if (menuRef.current?.contains(document.activeElement)) return;
            runRestrictedBlurValidate();
          }, 120);
        }}
        onKeyDown={onKeyDown}
        style={{
          borderColor: showInvalidStyle ? "#dc3545" : undefined,
        }}
      />
      {(blurInvalid || listInvalid) && !allowCustomValue && (
        <div className="invalid-feedback d-block small mt-1">
          Choose a KRA from the list. Custom text is not allowed.
        </div>
      )}
      {menuContent}
    </div>
  );
}
