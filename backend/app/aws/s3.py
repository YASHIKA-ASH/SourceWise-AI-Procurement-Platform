import os
import uuid
import boto3

from dotenv import load_dotenv

load_dotenv()

AWS_BUCKET = os.getenv("AWS_BUCKET_NAME")

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)


def upload_file(file, filename):

    unique_filename = f"{uuid.uuid4()}_{filename}"

    s3.upload_fileobj(
        file,
        AWS_BUCKET,
        unique_filename,
        ExtraArgs={
            "ContentType": "application/pdf"
        }
    )

    return (
        f"https://{AWS_BUCKET}.s3."
        f"{os.getenv('AWS_REGION')}.amazonaws.com/"
        f"{unique_filename}"
    )