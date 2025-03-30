interface IRoute {
	name: string;
	points: IPoint[];
	color: string
}

type IPoint = [number, number];