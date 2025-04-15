import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../app'
import {MemoryRouter} from 'react-router-dom'
import React from 'react'
import {server} from '../../tests/server'
import {rest} from 'msw'

test('Scénario 1 - Cas passant', async () => {
  render(<App />, {wrapper: MemoryRouter})

  // 1 - Home
  expect(screen.getByText(/Welcome home/i)).toBeInTheDocument()
  expect(screen.getByText(/Fill out the form/i)).toBeInTheDocument()

  // 2 - Clique sur "Fill out the form"
  await userEvent.click(screen.getByText(/Fill out the form/i))

  // 3 - Page 1
  expect(await screen.findByText(/Page 1/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Favorite food/i)).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText(/Favorite food/i), 'Les pâtes')
  await userEvent.click(screen.getByText(/Next/i))

  // 4 - Page 2
  expect(await screen.findByText(/Page 2/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Favorite drink/i)).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText(/Favorite drink/i), 'Bière')
  await userEvent.click(screen.getByText(/Review/i))

  // 5 - Page de confirmation
  expect(
    await screen.findByRole('button', {name: /Confirm/i}),
  ).toBeInTheDocument()
  expect(screen.getByText(/Please confirm your choices/i)).toBeInTheDocument()
  expect(screen.getByText(/Les pâtes/i)).toBeInTheDocument()
  expect(screen.getByText(/Bière/i)).toBeInTheDocument()

  // Click confirm - MSW will handle the request
  await userEvent.click(screen.getByRole('button', {name: /Confirm/i}))

  // 6 - Page de succès (wait for navigation)
  await waitFor(() => {
    expect(screen.getByText(/Congrats\. You did it\./i)).toBeInTheDocument()
  })

  await userEvent.click(screen.getByText(/Go home/i))

  // 7 - Retour à l'accueil
  await waitFor(() => {
    expect(screen.getByText(/Welcome home/i)).toBeInTheDocument()
  })
})

test('Scénario 2 - Cas non passant', async () => {
  // Render the app
  render(<App />, {wrapper: MemoryRouter})

  // 1-3 - Home
  expect(screen.getByText(/Welcome home/i)).toBeInTheDocument()
  expect(screen.getByText(/Fill out the form/i)).toBeInTheDocument()

  // 4 - Clique sur "Fill out the form"
  await userEvent.click(screen.getByText(/Fill out the form/i))

  // 5-8 - Page 1
  expect(await screen.findByText(/Page 1/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Favorite food/i)).toBeInTheDocument()

  // 9 - Champ vide (ensure it's empty)
  const foodInput = screen.getByLabelText(/Favorite food/i)
  await userEvent.clear(foodInput)

  // 10-11 - Suivant
  await userEvent.click(screen.getByText(/Next/i))

  // 12-15 - Page 2
  expect(await screen.findByText(/Page 2/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Favorite drink/i)).toBeInTheDocument()

  // 16 - Remplir "Bière"
  await userEvent.type(screen.getByLabelText(/Favorite drink/i), 'Bière')

  // 17-18 - Aller à la review
  await userEvent.click(screen.getByText(/Review/i))

  // 19-23 - Page de confirmation
  const confirmBtn = await screen.findByRole('button', {name: /Confirm/i})
  expect(confirmBtn).toBeInTheDocument()
  expect(screen.getByText(/Please confirm your choices/i)).toBeInTheDocument()

  const foodValueContainer = screen.getByText(/Favorite Food/i).closest('div')
  expect(foodValueContainer.textContent).toMatch(/Favorite Food:\s*$/)

  expect(screen.getByText(/Bière/)).toBeInTheDocument()

  // 24-26 - Clic sur confirm
  await userEvent.click(confirmBtn)

  // 27-29 - Page erreur (wait for navigation)
  await waitFor(() => {
    expect(screen.getByText(/Oh no. There was an error/i)).toBeInTheDocument()
  })

  expect(
    screen.getByText(/les champs food et drink sont obligatoires/i),
  ).toBeInTheDocument()

  // 30-31 - Liens erreur
  expect(screen.getByText(/Go home/i)).toBeInTheDocument()
  expect(screen.getByText(/Try again/i)).toBeInTheDocument()

  // 32 - Clic sur "Try again"
  await userEvent.click(screen.getByText(/Try again/i))

  // 33-34 - Retour page 1
  await waitFor(() => {
    expect(screen.getByText(/Page 1/i)).toBeInTheDocument()
  })
})
