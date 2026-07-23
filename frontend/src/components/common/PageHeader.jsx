export default function PageHeader({
  title,
  subtitle,
}) {
  return (
    <>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </>
  );
}