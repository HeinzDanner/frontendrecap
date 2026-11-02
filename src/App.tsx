import {useEffect, useState} from 'react'
import axios from 'axios'
import './App.css'

type Todo = {
    id: string
    description: string
    status: 'OPEN' | 'IN_PROGRESS' | 'DONE'
}

function App() {
    const [todos, setTodos] = useState<Todo[]>([])
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editDescription, setEditDescription] = useState('')
    const columns: { status: Todo['status']; title: string }[] = [
        {status: 'OPEN', title: 'Offen'},
        {status: 'IN_PROGRESS', title: 'In Bearbeitung'},
        {status: 'DONE', title: 'Erledigt'},
    ]

    useEffect(() => {
        axios
            .get<Todo[]>('/api/todo')
            .then((response) => setTodos(response.data))
            .catch(() => setError('Todos konnten nicht geladen werden.'))
    }, [])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmedDescription = description.trim()

        if (!trimmedDescription) return

        try {
            const response = await axios.post<Todo>('/api/todo', {
                description: trimmedDescription,
                status: 'OPEN',
            })
            setTodos((currentTodos) => [...currentTodos, response.data])
            setDescription('')
            setError('')
        } catch {
            setError('Todo konnte nicht gespeichert werden.')
        }
    }

    async function deleteTodo(id: string) {
        try {
            await axios.delete(`/api/todo/${id}`)
            setTodos((currentTodos) =>
                currentTodos.filter((todo) => todo.id !== id)
            )
            setError('')
        } catch {
            setError('Todo konnte nicht gelöscht werden.')
        }
    }

    async function advanceTodo(todo: Todo) {
        const nextStatus = todo.status === 'OPEN' ? 'IN_PROGRESS' : 'DONE'

        try {
            const response = await axios.put<Todo>(`/api/todo/${todo.id}`, {
                ...todo,
                status: nextStatus,
            })

            setTodos((currentTodos) =>
                currentTodos.map((item) =>
                    item.id === todo.id ? response.data : item
                )
            )
            setError('')
        } catch {
            setError('Status konnte nicht geändert werden.')
        }
    }

    function startEditing(todo: Todo) {
        setEditingId(todo.id)
        setEditDescription(todo.description)
        setError('')
    }

    async function saveDescription(todo: Todo) {
        const trimmedDescription = editDescription.trim()

        if (!trimmedDescription) {
            setError('Die Beschreibung darf nicht leer sein.')
            return
        }

        try {
            const response = await axios.put<Todo>(`/api/todo/${todo.id}`, {
                ...todo,
                description: trimmedDescription,
            })

            setTodos((currentTodos) =>
                currentTodos.map((item) =>
                    item.id === todo.id ? response.data : item
                )
            )
            setEditingId(null)
            setError('')
        } catch {
            setError('Beschreibung konnte nicht gespeichert werden.')
        }
    }

    return (
        <main className="todo-app">
            <header className="app-header">
                <p className="eyebrow">Dein Überblick</p>
                <h1>Meine Todos</h1>
                <p className="subtitle">Schritt für Schritt erledigt.</p>
            </header>

            <form className="todo-form" onSubmit={handleSubmit}>
                <input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Was möchtest du erledigen?"
                    aria-label="Neues Todo"
                />
                <button type="submit">Hinzufügen</button>
            </form>

            {error && <p className="error-message" role="alert">{error}</p>}

            <div className="todo-board">
                {columns.map((column) => {
                    const columnTodos = todos.filter(
                        (todo) => todo.status === column.status
                    )

                    return (
                        <section
                            className="todo-column"
                            key={column.status}
                            aria-labelledby={`column-${column.status}`}
                        >
                            <header className="column-header">
                                <h2 id={`column-${column.status}`}>{column.title}</h2>
                                <span className="todo-count">{columnTodos.length}</span>
                            </header>

                            {columnTodos.length === 0 ? (
                                <p className="empty-message">Noch keine Todos</p>
                            ) : (
                                <ul className="todo-list">
                                    {columnTodos.map((todo) => (
                                        <li key={todo.id}>
                                            <article className="todo-card">
                                                {editingId === todo.id ? (
                                                    <form
                                                        className="edit-form"
                                                        onSubmit={(event) => {
                                                            event.preventDefault()
                                                            void saveDescription(todo)
                                                        }}
                                                    >
                                                        <input
                                                            aria-label="Beschreibung bearbeiten"
                                                            value={editDescription}
                                                            onChange={(event) =>
                                                                setEditDescription(event.target.value)
                                                            }
                                                            autoFocus
                                                        />
                                                        <div className="todo-actions">
                                                            <button type="submit">Speichern</button>
                                                            <button
                                                                className="secondary-button"
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingId(null)
                                                                    setError('')
                                                                }}
                                                            >
                                                                Abbrechen
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <>
                                                        <p className="todo-description">
                                                            {todo.description} – {todo.status}
                                                        </p>

                                                        <div className="todo-actions">
                                                            <button
                                                                className="secondary-button"
                                                                type="button"
                                                                onClick={() => startEditing(todo)}
                                                            >
                                                                Bearbeiten
                                                            </button>

                                                            {todo.status !== 'DONE' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => advanceTodo(todo)}
                                                                >
                                                                    {todo.status === 'OPEN'
                                                                        ? 'Starten'
                                                                        : 'Abschließen'}
                                                                </button>
                                                            )}

                                                            <button
                                                                className="delete-button"
                                                                type="button"
                                                                onClick={() => deleteTodo(todo.id)}
                                                            >
                                                                Löschen
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </article>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )
                })}
            </div>
        </main>
    )
}

export default App