interface IRoute {
	name: string;
	segments: keyof ISegmentLib[];
	color: string
}

type ISegmentLib = Map<string, ISegment>;

type ISegment = IPoint[];

type IPoint = [number, number];