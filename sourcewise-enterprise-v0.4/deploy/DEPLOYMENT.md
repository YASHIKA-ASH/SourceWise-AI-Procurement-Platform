# EC2 Deployment Files

- `ec2-bootstrap.sh`: installs Docker and the CloudWatch agent on Amazon Linux 2023.
- `install-services.sh`: installs the systemd unit and starts the CloudWatch agent from the supplied JSON configuration.
- `sourcewise.service`: starts the production Docker Compose stack after reboot.
- `cloudwatch-agent-config.json`: ships SourceWise JSON logs and EC2 metrics to CloudWatch.
- `s3-cors.json`: browser-upload CORS configuration for the S3 bucket.
- `iam-s3-policy.json`: least-scope starting policy for the SourceWise S3 prefix. Replace the bucket placeholder before attaching it.
- `.deploy.env.example`: contains the Redis password required by production Compose.

The EC2 instance role should include AWS managed policy `CloudWatchAgentServerPolicy` and the customized S3 policy. The application obtains S3 credentials from the instance role through the normal AWS SDK credential chain.
