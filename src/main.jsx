import { StrictMode }          from 'react'
import { createRoot }          from 'react-dom/client'
import { BrowserRouter }       from 'react-router-dom'
import { ProgressProvider }    from './context/ProgressContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import App                     from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SubscriptionProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </SubscriptionProvider>
    </BrowserRouter>
  </StrictMode>
)
