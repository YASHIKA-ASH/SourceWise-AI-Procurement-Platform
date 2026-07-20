import os
import logging
import boto3
import watchtower

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("sourcewise")

logger.setLevel(logging.INFO)

client = boto3.client(
    "logs",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

logger.addHandler(
    watchtower.CloudWatchLogHandler(
        boto3_client=client,
        log_group_name="SourceWiseLogs"
    )
)