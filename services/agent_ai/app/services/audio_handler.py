import io
from pydub import AudioSegment

class AudioHandler:
    @staticmethod
    def transcode_to_wav(audio_data: bytes, source_format: str) -> bytes:
        """
        Transcode media format (e.g., ogg, aac, m4a, mp3) into standard WAV format.
        """
        try:
            # Load the audio data from memory
            audio_segment = AudioSegment.from_file(io.BytesIO(audio_data), format=source_format)
            
            # Export back to memory as WAV
            output_buffer = io.BytesIO()
            audio_segment.export(output_buffer, format="wav")
            return output_buffer.getvalue()
        except Exception as e:
            print(f"Audio transcoding failed: {e}")
            # If transcoding fails, fallback and return original bytes
            return audio_data

audio_handler = AudioHandler()
