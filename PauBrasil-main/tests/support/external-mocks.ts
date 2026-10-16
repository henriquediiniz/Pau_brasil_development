// Mocks para integrações externas - usado em testes
export const mockCloudinary = {
  uploader: {
    upload: vi.fn().mockResolvedValue({
      public_id: 'test_public_id',
      secure_url: 'https://res.cloudinary.com/test/image.jpg',
      format: 'jpg',
      width: 800,
      height: 600
    }),
    destroy: vi.fn().mockResolvedValue({ result: 'ok' })
  },
  config: vi.fn()
}

export const mockResend = {
  emails: {
    send: vi.fn().mockResolvedValue({
      id: 'test_email_id',
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email'
    })
  }
}

export const mockQRCode = {
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,test_qr_code')
}

// Setup global para testes
export function setupExternalMocks() {
  // Mock Cloudinary
  vi.mock('next-cloudinary', () => ({
    upload: mockCloudinary.uploader.upload,
    destroy: mockCloudinary.uploader.destroy
  }))

  // Mock Resend
  vi.mock('resend', () => ({
    Resend: vi.fn().mockImplementation(() => mockResend)
  }))

  // Mock QRCode
  vi.mock('qrcode', () => ({
    toDataURL: mockQRCode.toDataURL
  }))
}