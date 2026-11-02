import '@testing-library/jest-dom/vitest'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {cleanup, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import App from './App'

vi.mock('axios')

beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(axios.get).mockResolvedValue({data: []})
})

afterEach(() => {
    cleanup()
})

describe('Todo-App', () => {
    it('zeigt Todos aus dem Backend an', async () => {
        vi.mocked(axios.get).mockResolvedValue({
            data: [
                {id: '1', description: 'React lernen', status: 'OPEN'},
            ],
        })

        render(<App/>)

        expect(await screen.findByText('React lernen – OPEN')).toBeVisible()
        expect(axios.get).toHaveBeenCalledWith('/api/todo')
    })

    it('legt ein neues Todo an', async () => {
        const user = userEvent.setup()

        vi.mocked(axios.post).mockResolvedValue({
            data: {
                id: '2',
                description: 'Tests schreiben',
                status: 'OPEN',
            },
        })

        render(<App/>)

        // Erst die anfängliche Ladeanfrage abschließen lassen.
        await screen.findByRole('heading', {name: 'Meine Todos'})
        await user.type(
            screen.getByRole('textbox', {name: 'Neues Todo'}),
            'Tests schreiben',
        )
        await user.click(screen.getByRole('button', {name: 'Hinzufügen'}))

        expect(await screen.findByText('Tests schreiben – OPEN')).toBeVisible()
        expect(axios.post).toHaveBeenCalledWith('/api/todo', {
            description: 'Tests schreiben',
            status: 'OPEN',
        })
        expect(screen.getByRole('textbox', {name: 'Neues Todo'})).toHaveValue('')
    })

    it('zeigt einen Fehler, wenn das Laden fehlschlägt', async () => {
        vi.mocked(axios.get).mockRejectedValue(new Error('Netzwerkfehler'))

        render(<App/>)

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Todos konnten nicht geladen werden.',
        )
    })
})