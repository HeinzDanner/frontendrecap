import {useEffect, useState} from 'react'
import axios from 'axios'

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
        <main>
            <h1>Meine Todos</h1>

            <form onSubmit={handleSubmit}>
                <input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Neues Todo"
                    aria-label="Neues Todo"
                />
                <button type="submit">Hinzufügen</button>
            </form>

            {error && <p role="alert">{error}</p>}

            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}>
                        {editingId === todo.id ? (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    void saveDescription(todo)
                                }}
                            >
                                <input
                                    aria-label="Beschreibung bearbeiten"
                                    value={editDescription}
                                    onChange={(event) => setEditDescription(event.target.value)}
                                    autoFocus
                                />
                                <button type="submit">Speichern</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null)
                                        setError('')
                                    }}
                                >
                                    Abbrechen
                                </button>
                            </form>
                        ) : (
                            <>
                                {todo.description} – {todo.status}

                                <button type="button" onClick={() => startEditing(todo)}>
                                    Bearbeiten
                                </button>

                                {todo.status !== 'DONE' && (
                                    <button type="button" onClick={() => advanceTodo(todo)}>
                                        {todo.status === 'OPEN' ? 'Starten' : 'Abschließen'}
                                    </button>
                                )}

                                <button type="button" onClick={() => deleteTodo(todo.id)}>
                                    Löschen
                                </button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </main>
    )
}

export default App