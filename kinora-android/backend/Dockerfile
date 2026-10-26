FROM python:3.12-slim
RUN useradd --uid 10001 --create-home kinora && mkdir /data && chown kinora:kinora /data
WORKDIR /app
COPY server.py /app/server.py
USER kinora
ENV KINORA_HOST=0.0.0.0 KINORA_PORT=8080 KINORA_DB=/data/kinora.sqlite3
VOLUME ["/data"]
EXPOSE 8080
CMD ["python", "server.py"]
