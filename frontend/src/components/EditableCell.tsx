import { useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const VALUE_CLASSES: Record<string, string> = {
  Yes: "cell-yes",
  Partial: "cell-partial",
  No: "cell-no",
  Unknown: "cell-unknown",
};

export default function EditableCell({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setEditing(false);
    onChange(draft);
  }

  if (editing) {
    return (
      <select
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === "Enter" && commit()}
        className="cell-select"
      >
        <option>Yes</option>
        <option>Partial</option>
        <option>No</option>
        <option>Unknown</option>
      </select>
    );
  }

  return (
    <span
      className={`cell-badge ${VALUE_CLASSES[value] ?? "cell-unknown"}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
    >
      {value}
    </span>
  );
}
