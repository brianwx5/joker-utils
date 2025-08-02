# Debugging GitHub Actions Locally with `nektos/act`

[`nektos/act`](https://github.com/nektos/act) lets you run GitHub Actions workflows locally, so you can debug CI/CD issues before pushing to GitHub. This is especially useful for testing workflow changes, secrets, and build steps in a fast feedback loop.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [act](https://github.com/nektos/act) installed (`brew install act` on macOS, or see the [install guide](https://github.com/nektos/act#installation))

## Basic Usage

1. **Run a Workflow Locally**
   ```sh
   act
   ```
   This runs the default workflow (usually on `push`).

2. **Run a Specific Event**
   ```sh
   act pull_request
   ```
   This simulates a `pull_request` event.

3. **Run a Specific Job**
   ```sh
   act -j <job_id>
   ```
   Replace `<job_id>` with the job name from your workflow (e.g., `release`).

## Common Options

- `-l` or `--list`: List all available actions and jobs
- `-s <VAR=VALUE>`: Set environment variables or secrets (see below)
- `-P ubuntu-latest=nektos/act-environments-ubuntu:20.04`: Use a compatible Docker image for `ubuntu-latest`

## Handling Secrets

Create a `.secrets` file in your project root:

```
GITHUB_TOKEN=ghp_...yourtoken...
NPM_TOKEN=...yourtoken...
```

Or pass secrets inline:

```sh
act -s GITHUB_TOKEN=ghp_... -s NPM_TOKEN=...
```

## Example: Run the `release` Job

```sh
act -j release -s GITHUB_TOKEN=ghp_... -s NPM_TOKEN=...
```


## Inspecting the Docker Container for Deeper Debugging

When you run `act`, each job runs inside a Docker container. You can inspect or debug the running container if you need to troubleshoot environment issues, filesystem state, or installed tools.

### Steps to Inspect the Container

1. **Run act with `--container-architecture` if you are using M1 and `--detach`**
   ```sh
   act -j <job_id> --container-architecture linux/amd64 --detach
   ```
   This will start the container and leave it running after the job fails or completes.

2. **List running containers**
   ```sh
   docker ps
   ```
   Look for a container with a name like `act-<job_id>` or similar.

3. **Open a shell inside the container**
   ```sh
   docker exec -it <container_id_or_name> /bin/bash
   ```
   or, if bash is not available:
   ```sh
   docker exec -it <container_id_or_name> /bin/sh
   ```

4. **Explore the environment**
   - Check files, logs, environment variables, installed tools, etc.
   - You can rerun commands manually to see more detailed output.

5. **When done, exit the shell and stop/remove the container**
   ```sh
   docker stop <container_id_or_name>
   docker rm <container_id_or_name>
   ```

**Tip:** You can also add `sleep 9999` as a step in your workflow to keep the container alive for manual inspection.

---

## Debugging Tips

- Use `-v` or `--verbose` for more output:
  ```sh
  act -j release -v
  ```
- If you see permission errors, ensure Docker is running and you have access.
- If you need a different Node version, use the `-P` flag to specify an image:
  ```sh
  act -P ubuntu-latest=nektos/act-environments-ubuntu:20.04
  ```
- Some Actions (like `setup-node`) may not work exactly as on GitHub-hosted runners. Check the [act issues](https://github.com/nektos/act/issues) for workarounds.

## References
- [nektos/act GitHub](https://github.com/nektos/act)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Pro tip:** Use `act` for fast iteration on workflow changes, but always verify on GitHub Actions before merging to main!
