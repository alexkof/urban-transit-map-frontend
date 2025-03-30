import {parseGeoJSONRoutes} from "@/entities/geo-data/convertor";

export default async function loadGeoJSON(url: string) {
	const response = await fetch(url);
	const geoJsonData = await response.json();
	return parseGeoJSONRoutes(geoJsonData);
}