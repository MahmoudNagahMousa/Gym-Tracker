import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from '../context/AppContext.jsx'

/**
 * بيرندر أي صفحة جوه AppProvider + راوتر للاختبار.
 */
export function renderWithProviders(ui, { route = '/', initialState } = {}) {
  const user = userEvent.setup()
  const result = render(
    <AppProvider initialState={initialState}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  )
  return { user, ...result }
}

export default renderWithProviders
