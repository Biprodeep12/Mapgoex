import Image from 'next/image';
import { useState, useEffect } from 'react';

const WEATHER_ICON_BASE_URL = 'https://bmcdn.nl/assets/weather-icons/v3.0/fill/svg/';

export default function WeatherIcon({ weatherMain }: { weatherMain: string }) {
  const [weatherIconSrc, setWeatherIconSrc] = useState<string>('');

  useEffect(() => {
    let iconSrc = '';

    switch (weatherMain) {
      case 'Clouds':
        iconSrc = `${WEATHER_ICON_BASE_URL}cloudy.svg`;
        break;
      case 'Clear':
        iconSrc = `${WEATHER_ICON_BASE_URL}clear-day.svg`;
        break;
      case 'Rain':
        iconSrc = `${WEATHER_ICON_BASE_URL}rain.svg`;
        break;
      case 'Drizzle':
        iconSrc = `${WEATHER_ICON_BASE_URL}drizzle.svg`;
        break;
      case 'Mist':
        iconSrc = `${WEATHER_ICON_BASE_URL}mist.svg`;
        break;
      case 'Haze':
        iconSrc = `${WEATHER_ICON_BASE_URL}haze.svg`;
        break;
      case 'Fog':
        iconSrc = `${WEATHER_ICON_BASE_URL}fog.svg`;
        break;
      case 'Snow':
        iconSrc = `${WEATHER_ICON_BASE_URL}snow.svg`;
        break;
      case 'Smoke':
        iconSrc = `${WEATHER_ICON_BASE_URL}smoke.svg`;
        break;
      default:
        console.log('Unknown weather:', weatherMain);
        iconSrc = `${WEATHER_ICON_BASE_URL}unknown.svg`;
    }

    setWeatherIconSrc(iconSrc);
  }, [weatherMain]);

  return (
    <Image src={weatherIconSrc} alt={weatherMain} width={100} height={100}/>
  );
}
