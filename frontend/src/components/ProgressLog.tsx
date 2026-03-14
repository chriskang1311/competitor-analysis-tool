import { useEffect, useRef } from "react";

interface Props {
  items: string[];
}

export default function ProgressLog({ items }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  return (
    <div className="progress-log">
      {items.map((item, i) => (
        <p key={i}>{item}</p>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
