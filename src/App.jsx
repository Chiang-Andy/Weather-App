import { useState, useEffect } from 'react'
import './App.css'

const exampleLocations = [
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.006 },
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708 },
]

const weatherCodes = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Foggy', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌧️' },
  53: { description: 'Moderate drizzle', icon: '🌧️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  66: { description: 'Light freezing rain', icon: '🌨️' },
  67: { description: 'Heavy freezing rain', icon: '🌨️' },
  71: { description: 'Slight snow', icon: '❄️' },
  73: { description: 'Moderate snow', icon: '❄️' },
  75: { description: 'Heavy snow', icon: '❄️' },
  77: { description: 'Snow grains', icon: '❄️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌦️' },
  82: { description: 'Violent rain showers', icon: '🌦️' },
  85: { description: 'Slight snow showers', icon: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '🌨️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
}

function App() {
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [examples, setExamples] = useState([])

  useEffect(() => {
    const fetchExamples = async () => {
      const results = await Promise.all(
        exampleLocations.map(async (loc) => {
          try {
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code&temperature_unit=celsius`
            )
            const data = await response.json()
            return {
              ...loc,
              temperature: data.current.temperature_2m,
              weatherCode: data.current.weather_code,
            }
          } catch {
            return null
          }
        })
      )
      setExamples(results.filter(Boolean))
    }
    fetchExamples()
  }, [])

  const searchWeather = async (e) => {
    e.preventDefault()
    if (!location.trim()) return

    setLoading(true)
    setError('')
    setWeather(null)

    try {
      // First, geocode the location
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
      )
      const geoData = await geoResponse.json()

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found. Please try another search.')
      }

      const { latitude, longitude, name, country, admin1 } = geoData.results[0]

      // Then fetch the weather
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=celsius`
      )
      const weatherData = await weatherResponse.json()

      setWeather({
        location: name,
        region: admin1 || '',
        country: country,
        temperature: weatherData.current.temperature_2m,
        feelsLike: weatherData.current.apparent_temperature,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        weatherCode: weatherData.current.weather_code,
      })
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  const getWeatherInfo = (code) => {
    return weatherCodes[code] || { description: 'Unknown', icon: '🌡️' }
  }

  const selectExample = async (ex) => {
    setLoading(true)
    setError('')
    setLocation(ex.name)

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${ex.lat}&longitude=${ex.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=celsius`
      )
      const data = await response.json()

      setWeather({
        location: ex.name,
        region: '',
        country: ex.country,
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
      })
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Weather App</h1>

        <form onSubmit={searchWeather} className="search-form">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city name..."
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {weather && (
          <div className="weather-card">
            <div className="weather-header">
              <h2>{weather.location}</h2>
              <p className="location-detail">
                {weather.region && `${weather.region}, `}{weather.country}
              </p>
            </div>

            <div className="weather-main">
              <span className="weather-icon">{getWeatherInfo(weather.weatherCode).icon}</span>
              <span className="temperature">{Math.round(weather.temperature)}°C</span>
            </div>

            <p className="weather-description">{getWeatherInfo(weather.weatherCode).description}</p>

            <div className="weather-details">
              <div className="detail">
                <span className="detail-label">Feels like</span>
                <span className="detail-value">{Math.round(weather.feelsLike)}°C</span>
              </div>
              <div className="detail">
                <span className="detail-label">Humidity</span>
                <span className="detail-value">{weather.humidity}%</span>
              </div>
              <div className="detail">
                <span className="detail-label">Wind</span>
                <span className="detail-value">{weather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        )}

        {!weather && examples.length > 0 && (
          <div className="examples-section">
            <h3>Weather Around the World</h3>
            <div className="examples-grid">
              {examples.map((ex) => (
                <div key={ex.name} className="example-card" onClick={() => selectExample(ex)}>
                  <span className="example-icon">{getWeatherInfo(ex.weatherCode).icon}</span>
                  <div className="example-info">
                    <span className="example-city">{ex.name}</span>
                    <span className="example-country">{ex.country}</span>
                  </div>
                  <span className="example-temp">{Math.round(ex.temperature)}°C</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
