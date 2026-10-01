import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { TaskList } from '@/components/tasks/task-list'
import { getTasks, requireUser } from '@/lib/workspace'

export const metadata: Metadata = { title: 'Tasks' }

export default async function TasksPage() {
  const user = await requireUser()
  const tasks = await getTasks(user.id)
  const open = tasks.filter((t) => !t.done).length

  return (
    <PageContainer>
      <PageHeader title="Tasks" description={`${open} open · created from reviews, alerts, meeting notes and compliance checks`} />
      <TaskList tasks={tasks.map(({ id, title, client, due, source, done }) => ({ id, title, client, due, source, done }))} />
    </PageContainer>
  )
}
