import {render, screen} from '@testing-library/react'

import React from 'react'
import userEvent from '@testing-library/user-event'
import App from '../app'
import {MemoryRouter} from 'react-router-dom'
import * as api from '../api'

test('Scénario 1 - Cas passant', async () => {
  // 0. Mock API
  jest.spyOn(api, 'submitForm').mockResolvedValueOnce({})

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
    await screen.getByRole('button', {name: /Confirm/i}),
  ).toBeInTheDocument()
  expect(screen.getByText(/Please confirm your choices/i)).toBeInTheDocument()
  expect(screen.getByText(/Les pâtes/i)).toBeInTheDocument()
  expect(screen.getByText(/Bière/i)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', {name: /Confirm/i}))

  // 6 - Page de succès
  expect(
    await screen.findByText(/Congrats\. You did it\./i),
  ).toBeInTheDocument()
  await userEvent.click(screen.getByText(/Go home/i))

  // 7 - Retour à l'accueil
  expect(await screen.findByText(/Welcome home/i)).toBeInTheDocument()
})
test('Scénario 2 - Cas non passant', async () => {
  // 0. Mock API pour simuler une erreur
  jest
    .spyOn(api, 'submitForm')
    .mockRejectedValueOnce(
      new Error('les champs food et drink sont obligatoires'),
    )

  render(<App />, {wrapper: MemoryRouter})

  // 1-3 - Home
  expect(screen.getByText(/Welcome home/i)).toBeInTheDocument()
  expect(screen.getByText(/Fill out the form/i)).toBeInTheDocument()

  // 4 - Clique sur "Fill out the form"
  await userEvent.click(screen.getByText(/Fill out the form/i))

  // 5-8 - Page 1
  expect(await screen.findByText(/Page 1/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Favorite food/i)).toBeInTheDocument()

  // 9 - Champ vide
  await userEvent.clear(screen.getByLabelText(/Favorite food/i))

  // 10-11 - Suivant
  await userEvent.click(screen.getByText(/Next/i))

  // 12-15 - Page 2
  expect(await screen.findByText(/Page 2/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Favorite drink/i)).toBeInTheDocument()

  // 16 - Remplir "Bière"
  await userEvent.type(screen.getByLabelText(/Favorite drink/i), 'Bière')

  // 17-18 - Aller à la review
  await userEvent.click(screen.getByText(/Review/i))
  const confirmBtn = screen.getByRole('button', {name: /Confirm/i})
  // 19-23 - Page de confirmation
  expect(await confirmBtn).toBeInTheDocument()
  expect(screen.getByText(/Please confirm your choices/i)).toBeInTheDocument()
  const emptySpans = screen.queryAllByText(/^$/)
  expect(emptySpans.length).toBeGreaterThan(0) // texte vide pour food
  expect(screen.getByText(/Bière/)).toBeInTheDocument()

  // 24-25 - Bouton confirm

  expect(confirmBtn).toBeInTheDocument()

  // 26 - Clic sur confirm
  await userEvent.click(confirmBtn)

  // 27-29 - Page erreur
  expect(
    await screen.findByText(/Oh no. There was an error/i),
  ).toBeInTheDocument()
  expect(
    screen.getByText(/les champs food et drink sont obligatoires/i),
  ).toBeInTheDocument()

  // 30-31 - Liens erreur
  expect(screen.getByText(/Go home/i)).toBeInTheDocument()
  expect(screen.getByText(/Try again/i)).toBeInTheDocument()

  // 32 - Clic sur "Try again"
  await userEvent.click(screen.getByText(/Try again/i))

  // 33-34 - Retour page 1
  expect(await screen.findByText(/Page 1/i)).toBeInTheDocument()
})
