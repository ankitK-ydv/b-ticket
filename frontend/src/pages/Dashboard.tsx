interface DashboardProps {
  title: string
  description: string
}

function Dashboard({ title, description }: DashboardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-500">
          {title}
        </h1>

        <p className="mt-4 text-slate-300">
          {description}
        </p>
      </div>
    </div>
  )
}

export default Dashboard