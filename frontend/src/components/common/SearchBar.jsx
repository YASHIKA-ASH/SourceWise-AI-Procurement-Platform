import Input from "./Input";

export default function SearchBar({
  value,
  onChange,
}) {
  return (
    <Input
      placeholder="Search..."
      value={value}
      onChange={onChange}
    />
  );
}