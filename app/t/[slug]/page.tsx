export default function TSlug({ params }: { params: { slug: string } }) {
  return <div style={{ padding: 40, fontFamily: 'system-ui' }}>t slug: {params.slug}</div>
}
