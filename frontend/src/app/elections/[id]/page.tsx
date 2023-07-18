export default function ElectionPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Election Page {params.id}</h1>
    </div>
  )
}