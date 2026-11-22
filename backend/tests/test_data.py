import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_generated_csv_data_is_valid():
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "validate_data.py")],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
