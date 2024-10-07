"use client";

import { useState,useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Head from "next/head";
import Image from "next/image";

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
    };
    air_quality: {
      co: number;
      no2: number;
      o3: number;
      pm10: number;
      pm2_5: number;
      so2: number;
      aqi: number;
    };
    wind_kph: number;
    wind_mph: number;
    wind_degree: number;
    humidity: number;
    uv: number;
  };
}

export default function Weather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [windUnit, setWindUnit] = useState<"km/h" | "mph">("km/h");
  const [unit, setUnit] = useState<"C" | "F">("C");

  const toggleWindUnit = () => {
    setWindUnit((prevUnit) => (prevUnit === "km/h" ? "mph" : "km/h"));
  };

  const toggleTemperatureUnit = () => {
    setUnit((prevUnit) => (prevUnit === "C" ? "F" : "C"));
  };

  const getCompassDirection = (degree: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degree / 45) % 8;
    return directions[index];
  };

  const getUVIndex = (uv: number): string => {
    if (uv >= 0 && uv <= 2) return "Low";
    if (uv > 2 && uv <= 5) return "Moderate";
    if (uv > 5 && uv <= 7) return "High";
    if (uv > 7 && uv <= 10) return "Very High";
    if (uv > 10) return "Extreme";
    return "Invalid";
  };

  const calculateAQI = (
    concentration: number,
    breakpoints: { low: number; high: number; aqiLow: number; aqiHigh: number }
  ) => {
    return Math.round(
      ((concentration - breakpoints.low) /
        (breakpoints.high - breakpoints.low)) *
        (breakpoints.aqiHigh - breakpoints.aqiLow) +
        breakpoints.aqiLow
    );
  };

  const getAQIValue = (airQuality: WeatherData["current"]["air_quality"]) => {
    const breakpoints = {
      pm10: { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
      pm2_5: { low: 0, high: 12, aqiLow: 0, aqiHigh: 50 },
      no2: { low: 0, high: 53, aqiLow: 0, aqiHigh: 50 },
      o3: { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
      co: { low: 0, high: 4.4, aqiLow: 0, aqiHigh: 50 },
      so2: { low: 0, high: 35, aqiLow: 0, aqiHigh: 50 },
    };

    const aqiValues = {
      pm10: calculateAQI(airQuality.pm10, breakpoints.pm10),
      pm2_5: calculateAQI(airQuality.pm2_5, breakpoints.pm2_5),
      no2: calculateAQI(airQuality.no2, breakpoints.no2),
      o3: calculateAQI(airQuality.o3, breakpoints.o3),
      co: calculateAQI(airQuality.co, breakpoints.co),
      so2: calculateAQI(airQuality.so2, breakpoints.so2),
    };

    return Math.max(...Object.values(aqiValues));
  };

  const getAQICategory = (aqi: number): string => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  const getWeatherByLocation = useCallback(async (latitude: number, longitude: number) => {
    try {
      const apiUrl = `https://api.weatherapi.com/v1/current.json?key=af7e85bdbb3e46a7946145455241707&q=${latitude},${longitude}&aqi=yes`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Location not found");
      }

      const result = await response.json();
      setData(result);
      setError("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setData(null);
    }
  }, []);

  const getWeatherByCity = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=af7e85bdbb3e46a7946145455241707&q=${city}&aqi=yes`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("City not found");
      }

      const data: WeatherData = await response.json();
      setData(data);
      setError(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [city]);

  const handleGeolocation = useCallback(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          getWeatherByLocation(latitude, longitude)
            .then(() => setLoading(false))
            .catch(() => setLoading(false));
        },
        (error) => {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError("An unexpected error occurred.");
          }
          setData(null);
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, [getWeatherByLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city) {
      getWeatherByCity();
    } else {
      handleGeolocation();
    }
  };

  const handleReset = () => {
    setError(null);
    setData(null);
    setCity("");
  };

  const getBackgroundImage = (condition: string) => {
    if (condition.includes("Sunny")) {
      return "https://images.pexels.com/photos/3578286/pexels-photo-3578286.jpeg?auto=compress&cs=tinysrgb&w=600";
    } else if (condition.includes("Cloudy") || condition.includes("Partly cloudy")) {
      return "https://images.unsplash.com/photo-1595661671412-e20c4a3e65cc?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    } else if (condition.includes("Rain") || condition.includes("Light rain") || condition.includes("Moderate rain") || condition.includes("Heavy rain")) {
      return "https://images.pexels.com/photos/304875/pexels-photo-304875.jpeg?cs=srgb&dl=pexels-veeterzy-304875.jpg&fm=jpg";
    } else if (condition.includes("Snow")) {
      return "https://images.unsplash.com/photo-1709713543634-544dd5e07315?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c25vd3klMjB3ZWF0aGVyfGVufDB8fDB8fHwy";
    } else if (condition.includes("Storm") || condition.includes("Thunderstorm")) {
      return "https://images.unsplash.com/photo-1692699469356-b0d4ccbb280d?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    } else if (condition.includes("Clear")) {
      return "https://images.unsplash.com/photo-1692213079248-89666fdbd90b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    } else if (condition.includes("Mist")) {
      return "https://images.unsplash.com/photo-1580193813605-a5c78b4ee01a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fG1pc3QlMjB3ZWF0aGVyfGVufDB8fDB8fHww";
    } else if (condition.includes("Overcast")) {
      return "https://images.pexels.com/photos/18272914/pexels-photo-18272914/free-photo-of-overcast-over-road-on-wasteland.jpeg?auto=compress&cs=tinysrgb&w=600";
    } else {
      return "https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
    }
  };

  const backgroundImage = data ? getBackgroundImage(data.current.condition.text) : "";

  return (
    <div className="relative flex justify-center items-center w-full min-h-screen weather-container">
      <Head>
        <title>Weather App</title>
      </Head>
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${backgroundImage || "https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"})`,
        }}
      />
      <main className="relative backdrop-blur-md bg-white/10 w-[90%] max-w-4xl flex flex-col justify-evenly items-center min-h-[80vh] m-8 rounded-lg shadow-lg transition-all duration-300 hover:bg-white/20">
        <div className="flex flex-col justify-evenly items-center w-full max-w-md p-6">
          <form onSubmit={handleSubmit} onReset={handleReset} className="w-full">
            <Input
              type="text"
              placeholder="Enter City Name"
              value={city}
              className="hover:border text-extrabold hover:border-white border-none outline-none text-black placeholder:text-black text-font-extrabold w-full h-[50px] bg-transparent mb-4 transition-all duration-300 focus:ring-2 focus:ring-white"
              onChange={(e) => setCity(e.target.value)}
              aria-label="Enter city name"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="ghost" type="submit" className="transition-colors duration-300 hover:bg-white/30">
                Get Weather
              </Button>
              <Button variant="ghost" type="reset" className="transition-colors duration-300 hover:bg-white/30">
                Clear
              </Button>
              <Button variant="ghost" onClick={toggleWindUnit} className="transition-colors duration-300 hover:bg-white/30">
                {windUnit === "km/h" ? "Switch to mph" : "Switch to km/h"}
              </Button>
              <Button variant="ghost" onClick={toggleTemperatureUnit} className="transition-colors duration-300 hover:bg-white/30">
                {unit === "C" ? "Switch to °F" : "Switch to °C"}
              </Button>
            </div>
          </form>
        </div>
        <div className="w-full px-4">
          {loading && <p className="text-center text-white">Loading...</p>}
          {error && <p className="text-center text-red-500" role="alert">{error}</p>}
          {data && (
            <div className="bg-white/50 text-black rounded-lg shadow-md p-6 transition-all duration-300 hover:bg-white/60">
              <div className="flex flex-wrap justify-around items-center">
                <div className="flex flex-col items-center mb-4 md:mb-0">
                  <Image
                    src={`https:${data.current.condition.icon}`}
                    alt={data.current.condition.text}
                    width={100}
                    height={100}
                    className="transition-transform duration-300 hover:scale-110"
                  />
                  <p className="mt-2 text-lg font-semibold">{data.current.condition.text}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-3xl font-bold mb-2">
                    {unit === "C" ? `${data.current.temp_c}°C` : `${data.current.temp_f}°F`}
                  </p>
                  <p className="text-xl">{data.location.name}, {data.location.country}</p>
                </div>
                <div className="w-full md:w-auto mt-4 md:mt-0">
                  <p>AQI: {data.current.air_quality ? `${getAQICategory(getAQIValue(data.current.air_quality))} (${getAQIValue(data.current.air_quality)})` : "N/A"}</p>
                  <p>UV Index: {getUVIndex(data.current.uv)} ({data.current.uv})</p>
                  <p>Wind: {getCompassDirection(data.current.wind_degree)} {windUnit === "km/h" ? `${data.current.wind_kph} km/h` : `${data.current.wind_mph} mph`}</p>
                  <p>Humidity: {data.current.humidity}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <style jsx global>{`
        .weather-container {
          background: linear-gradient(to bottom right, #4a90e2, #50c9c3);
        }
      `}</style>
    </div>
  );
}