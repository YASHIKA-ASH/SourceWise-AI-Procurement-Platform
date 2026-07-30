import { api } from './api'

export async function uploadProcurementDocument(file, productId = null) {
  const presigned = await api.presignFileUpload({
    filename: file.name,
    content_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    product_id: productId,
  })

  const form = new FormData()
  Object.entries(presigned.fields).forEach(([key, value]) => form.append(key, value))
  form.append('file', file)

  const uploadResponse = await fetch(presigned.upload_url, { method: 'POST', body: form })
  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed with status ${uploadResponse.status}`)
  }

  return api.completeFileUpload({
    object_key: presigned.object_key,
    filename: file.name,
    content_type: file.type || 'application/octet-stream',
    product_id: productId,
  })
}
