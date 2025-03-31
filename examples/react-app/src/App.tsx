import { useState, useEffect, useRef } from 'react'
import './App.css'
import { createHttpClient, EnhancedLogger } from '@arthurmtro/openapi-tools-common'

// Initialize enhanced logger
const logger = new EnhancedLogger({
  level: 'debug',
  prefix: '[PetStore]',
  colorize: true,
  timestamp: true
})

// Create HTTP client with debounce enabled
const httpClient = createHttpClient({
  baseURL: 'https://petstore.swagger.io/v2',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  // Enable debouncing with a 300ms delay
  debounce: {
    enabled: true,
    delay: 300, 
    cancelPending: true,
    maxWait: 1000
  }
})

// Add request interceptor to log requests
httpClient.addRequestInterceptor((config) => {
  logger.info(`Making request to ${config.url}`)
  return config
})

// Add error interceptor using the enhanced logger
httpClient.addErrorInterceptor(logger.createErrorInterceptor())

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [pets, setPets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchKey, setSearchKey] = useState<string>('pet')
  
  // Track API calls
  const [apiCallsMade, setApiCallsMade] = useState(0)
  const [debouncedCalls, setDebouncedCalls] = useState(0)
  
  // Store console logs for display
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const consoleLogsRef = useRef<string[]>([])
  
  // Override console methods to capture logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    }
    
    const captureLog = (type: string, ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      
      consoleLogsRef.current = [
        `[${type.toUpperCase()}] ${message}`, 
        ...consoleLogsRef.current
      ].slice(0, 50)
      
      setConsoleLogs([...consoleLogsRef.current])
      
      // Call original console method
      originalConsole[type as keyof typeof originalConsole](...args)
    }
    
    console.log = (...args) => captureLog('log', ...args)
    console.info = (...args) => captureLog('info', ...args)
    console.warn = (...args) => captureLog('warn', ...args)
    console.error = (...args) => captureLog('error', ...args)
    console.debug = (...args) => captureLog('debug', ...args)
    
    return () => {
      // Restore original console methods
      console.log = originalConsole.log
      console.info = originalConsole.info
      console.warn = originalConsole.warn
      console.error = originalConsole.error
      console.debug = originalConsole.debug
    }
  }, [])
  
  // Example search function to show debouncing
  const searchPets = async (query: string) => {
    setApiCallsMade(prev => prev + 1)
    
    if (!query) {
      setPets([])
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const endpoint = `/${searchKey}/${query}`
      logger.debug(`Searching with query: ${query}`)
      
      const response = await httpClient.get(endpoint)
      setDebouncedCalls(prev => prev + 1)
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        setPets(response.data)
      } else if (response.data) {
        setPets([response.data])
      } else {
        setPets([])
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during search')
      logger.error('Search failed:', err)
      setPets([])
    } finally {
      setLoading(false)
    }
  }
  
  // Update search results when search term changes
  useEffect(() => {
    searchPets(searchTerm)
  }, [searchTerm])
  
  // Function to cancel all pending requests
  const cancelPendingRequests = () => {
    httpClient.cancelAllRequests()
    logger.info('Cancelled all pending requests')
  }

  return (
    <div className="app-container">
      <header>
        <h1>🐾 PetStore API Client Demo</h1>
        <p>Demonstrating OpenAPI Tools with Request Debouncing &amp; Enhanced Logging</p>
      </header>
      
      <div className="main-content">
        <section className="controls">
          <div className="search-container">
            <div className="search-controls">
              <select 
                value={searchKey} 
                onChange={(e) => setSearchKey(e.target.value)}
                className="endpoint-select"
              >
                <option value="pet">Search by Pet ID</option>
                <option value="user">Search by User ID</option>
                <option value="store/order">Search by Order ID</option>
              </select>
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter ID to search..."
                className="search-input"
              />
            </div>
            
            <button onClick={cancelPendingRequests} className="cancel-button">
              Cancel Pending Requests
            </button>
          </div>
          
          <div className="stats">
            <div className="stat-box">
              <span className="stat-label">API Calls Attempted:</span>
              <span className="stat-value">{apiCallsMade}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">API Calls Executed:</span>
              <span className="stat-value">{debouncedCalls}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Calls Debounced:</span>
              <span className="stat-value">{apiCallsMade - debouncedCalls}</span>
            </div>
          </div>
        </section>
        
        <div className="content-panels">
          <section className="results-panel">
            <h2>Search Results</h2>
            {loading && <p className="loading">Loading...</p>}
            {error && <p className="error">Error: {error}</p>}
            
            {!loading && !error && pets.length === 0 && (
              <p className="no-results">No results found. Try searching with a different ID.</p>
            )}
            
            {pets.length > 0 && (
              <div className="results">
                <pre>{JSON.stringify(pets, null, 2)}</pre>
              </div>
            )}
          </section>
          
          <section className="console-panel">
            <h2>Console Logs</h2>
            <div className="console">
              {consoleLogs.map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      
      <footer>
        <p>
          This demo showcases the OpenAPI Tools library with the following features:
          <ul>
            <li>Request debouncing to prevent API spam</li>
            <li>Enhanced logging with timestamp and error classification</li>
            <li>Request cancellation</li>
            <li>Request interceptors</li>
          </ul>
        </p>
        <p>Try typing rapidly in the search box to see debouncing in action!</p>
      </footer>
    </div>
  )
}

export default App