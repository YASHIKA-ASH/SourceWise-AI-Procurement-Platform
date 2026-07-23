export default function Error({
  message,
}) {
  return (
    <div
      style={{
        color: "red",
        padding: 20,
      }}
    >
      {message}
    </div>
  );
}