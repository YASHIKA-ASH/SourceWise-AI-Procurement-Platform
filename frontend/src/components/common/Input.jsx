export default function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 8,
        border: "1px solid #ddd",
      }}
    />
  );
}