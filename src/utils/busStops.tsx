import axios from "axios";

export const busStopsInfo = async (coords: [number, number]): Promise<string> => {
  if(!coords) return "Unknown location";
  
  try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${coords[1]}&lon=${coords[0]}&format=json`);
      const data = res.data;
      
      if (data.address) {
        const { suburb, city, state, country } = data.address;
        if (suburb && city) {
          return `${suburb}, ${city}`;
        } else if (city) {
          return city;
        } else if (state) {
          return state;
        } else if (country) {
          return country;
        }
      }
      
      return "Unknown location";
  } catch (err) {
      console.log(err);
      return "Location unavailable";
  }
}