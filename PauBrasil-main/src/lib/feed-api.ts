export interface FeedSession {
  user?: { id: string } | null
}

export interface FeedEventItem {
  id: string
  type: string
  message: string
  createdAt: Date | string
  user: { id: string; name: string | null; photoUrl: string | null }
}

export async function getFeedPayload(
  session: FeedSession | null,
  deps: {
    findFeedEvents: () => Promise<FeedEventItem[]>
  },
) {
  if (!session?.user) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  try {
    const events = await deps.findFeedEvents()
    return { status: 200, body: events }
  } catch {
    return { status: 500, body: { error: 'Erro ao buscar feed' } }
  }
}
