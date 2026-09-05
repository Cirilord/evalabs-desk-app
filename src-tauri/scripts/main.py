import json
import os
import importlib.util
import sys

automation_path = os.environ["EVA_AUTOMATION_PATH"]
sys.path.insert(0, os.path.dirname(automation_path))
module_spec = importlib.util.spec_from_file_location("eva_automation", automation_path)

if module_spec is None or module_spec.loader is None:
    raise ImportError("Could not load the automation script.")

automation = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(automation)
process = automation.process

inputs = json.loads(os.environ["EVA_INPUTS"])
outputs = process(inputs)

if not isinstance(outputs, dict):
    raise TypeError("process must return a dict.")

with open(os.environ["EVA_OUTPUTS_PATH"], "w", encoding="utf-8") as output_file:
    json.dump(outputs, output_file)
