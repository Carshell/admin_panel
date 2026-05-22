export default function StatusDot({ status, error, checking }) {
  let className = "status-dot";
  let title = "No monitor URL";

  if (checking && status === undefined) {
    className += " status-pending";
    title = "Checking…";
  } else if (status === true) {
    className += " status-up";
    title = "Online";
  } else if (status === false) {
    className += " status-down";
    title = error ? `Offline: ${error}` : "Offline";
  } else if (status === null || status === undefined) {
    className += " status-unknown";
    title = "No monitor URL";
  }

  return (
    <span
      className={className}
      title={title}
      aria-label={title}
      role="status"
    />
  );
}
