interface Props {
  productName: string;
  productDescription: string;
  maxCompetitors: number;
  onProductNameChange: (v: string) => void;
  onProductDescriptionChange: (v: string) => void;
  onMaxCompetitorsChange: (v: number) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function AnalysisForm({
  productName,
  productDescription,
  maxCompetitors,
  onProductNameChange,
  onProductDescriptionChange,
  onMaxCompetitorsChange,
  onSubmit,
  disabled,
}: Props) {
  return (
    <div>
      <div className="field">
        <label htmlFor="productName">Product Name</label>
        <input
          id="productName"
          type="text"
          value={productName}
          placeholder="e.g. Insurance Eligibility Identifier"
          onChange={(e) => onProductNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          disabled={disabled}
        />
      </div>

      <div className="field">
        <label htmlFor="productDescription">Product Description</label>
        <textarea
          id="productDescription"
          value={productDescription}
          placeholder="Describe what the product does, who it serves, and what problem it solves..."
          onChange={(e) => onProductDescriptionChange(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="form-row">
        <div className="field field-narrow">
          <label htmlFor="maxCompetitors">Competitors to research</label>
          <select
            id="maxCompetitors"
            value={maxCompetitors}
            onChange={(e) => onMaxCompetitorsChange(Number(e.target.value))}
            disabled={disabled}
          >
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
            <option value={7}>7</option>
          </select>
          <p className="hint">More = longer run time</p>
        </div>
      </div>

      <button className="btn-primary" onClick={onSubmit} disabled={disabled}>
        {disabled ? "Analyzing…" : "Run Competitor Analysis"}
      </button>
    </div>
  );
}
