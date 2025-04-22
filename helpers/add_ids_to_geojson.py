import json
import re

def add_ids_to_geojson(input_file, output_file):
    """
    Добавляет ID к фичам GeoJSON, сохраняя координаты как числа без изменений.
    """
    # Чтение файла как строки (чтобы контролировать парсинг чисел)
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Парсинг JSON с сохранением чисел как float (но без лишнего округления)
    geojson = json.loads(content)

    # Добавление ID
    if geojson.get('type') == 'FeatureCollection':
        for i, feature in enumerate(geojson['features'], start=1):
            feature['id'] = i

    # Функция для точной сериализации чисел
    def precise_dump(obj, indent=None):
        json_str = json.dumps(obj, indent=indent, ensure_ascii=False)
        # Убираем лишние пробелы вокруг чисел (для компактности)
        json_str = re.sub(r'\s+([\d.eE+-]+)\s+', r'\1', json_str)
        return json_str

    # Сохранение с точными числами
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(precise_dump(geojson, indent=2))

    print(f"ID добавлены. Результат сохранён в {output_file}")

# Пример использования
if __name__ == "__main__":
    names = [
        'test_routes2.geo.json',
        'all_routes_current.geo.json',
        'tram_new.geo.json',
        'tram_current.geo.json',
        'tram_inner.geo.json'
    ]

    for name in names:
        out_name = f'/public/{name.split(".")[0]}_with_ids.geo.json'
        add_ids_to_geojson(f'../public/{name.split('.')[0]}_with_segment_refs.geo.json', '..'+out_name)
        print(out_name)
    # add_ids_to_geojson('public/all_lines.geo.json', 'public/all_lines_with_ids.geo.json')