/** Sekme ikonu: koyu daire içinde turuncu ok. */
export function BrandMark({ size }: { size: number }) {
  const top = Math.round(size * 0.22);
  const left = Math.round(size * 0.28);

  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#2A2A2A",
        borderRadius: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: `${top}px solid transparent`,
          borderBottom: `${top}px solid transparent`,
          borderLeft: `${left}px solid #F97316`,
          display: "flex",
        }}
      />
    </div>
  );
}
