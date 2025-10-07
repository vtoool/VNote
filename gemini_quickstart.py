"""Minimal example script for calling the Gemini API with the google-genai client."""

# Install the official Gemini client library. In a real project you would usually
# do this outside the script (e.g., in requirements.txt), but it is shown here
# explicitly so you can copy-paste and run this file standalone.
import subprocess
import sys

# Ensure google-genai is installed/up to date. The -q flag keeps pip quiet.
subprocess.check_call(
    [
        sys.executable,
        "-m",
        "pip",
        "install",
        "-q",
        "-U",
        "google-genai",
    ]
)

from google import genai


def main() -> None:
    """Create a Gemini client, send a prompt, and print the response text."""

    # Replace the placeholder below with your actual Gemini API key before running
    # this script.
    api_key = "AIzaSyCNhEJt6wbopVGULGiuYmbPsXWh9DSBHOc"

    # Initialize the client. Passing the key explicitly makes it clear which
    # credentials are being used.
    client = genai.Client(api_key=api_key)

    # Call the Gemini model and print the generated text response.
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Hello from Gemini!",
    )
    print(response.text)


if __name__ == "__main__":
    main()
