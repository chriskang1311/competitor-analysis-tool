interface RunningJob {
  productId: string;
  productName: string;
  type: "discovery" | "analysis";
}

interface Props {
  jobs: RunningJob[];
  onGoToProduct: (productId: string) => void;
}

export default function RunningJobBanner({ jobs, onGoToProduct }: Props) {
  if (jobs.length === 0) return null;

  return (
    <div className="running-job-banner">
      <div className="running-job-banner-inner">
        <div className="spinner running-job-spinner" />
        <div className="running-job-items">
          {jobs.map(job => (
            <span key={job.productId} className="running-job-item">
              {job.type === "discovery" ? "Finding competitors" : "Analyzing"} for{" "}
              <button
                className="running-job-link"
                onClick={() => onGoToProduct(job.productId)}
              >
                {job.productName}
              </button>
              …
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
