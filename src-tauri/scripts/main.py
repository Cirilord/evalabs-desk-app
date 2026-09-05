import json
import os

from automation import process

inputs = json.loads(os.environ["EVA_INPUTS"])
outputs = process(inputs)

if not isinstance(outputs, dict):
    raise TypeError("process must return a dict.")

with open(os.environ["EVA_OUTPUTS_PATH"], "w", encoding="utf-8") as output_file:
    json.dump(outputs, output_file)
