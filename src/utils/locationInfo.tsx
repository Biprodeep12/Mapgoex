import { useMapContext } from "@/context/MapContext"


export const Focus = (coords:[number,number]) => {
    const { setMapCenter } = useMapContext();

    setMapCenter({center: [coords[0],coords[1]],zoom: 15})
}