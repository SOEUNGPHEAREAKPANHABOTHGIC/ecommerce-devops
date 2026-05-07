pipeline {
  agent any

  environment {
    DOCKERHUB_USER  = "both007"
    BACKEND_IMAGE   = "${DOCKERHUB_USER}/ecommerce-backend"
    FRONTEND_IMAGE  = "${DOCKERHUB_USER}/ecommerce-frontend"
    GIT_TAG         = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    NODE_HOME       = tool 'node18'
    PATH            = "${NODE_HOME}/bin:${env.PATH}"
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        echo "Building commit: ${GIT_TAG}"
      }
    }

    stage('Test Backend') {
      steps {
        dir('backend') {
          sh 'npm ci'
          sh 'npm test'
        }
      }
    }

    stage('Test Frontend') {
      steps {
        dir('frontend') {
          sh 'npm ci'
          sh 'npm test'
        }
      }
    }

    stage('Build Images') {
      parallel {
        stage('Build Backend') {
          steps {
            dir('backend') {
              sh "docker build -t ${BACKEND_IMAGE}:${GIT_TAG} ."
              sh "docker tag ${BACKEND_IMAGE}:${GIT_TAG} ${BACKEND_IMAGE}:latest"
            }
          }
        }
        stage('Build Frontend') {
          steps {
            dir('frontend') {
              sh "docker build -t ${FRONTEND_IMAGE}:${GIT_TAG} ."
              sh "docker tag ${FRONTEND_IMAGE}:${GIT_TAG} ${FRONTEND_IMAGE}:latest"
            }
          }
        }
      }
    }

    stage('Trivy Security Scan') {
      parallel {
        stage('Scan Backend') {
          steps {
            sh """
              docker run --rm \
                -v /var/run/docker.sock:/var/run/docker.sock \
                aquasec/trivy image \
                --severity HIGH,CRITICAL \
                --exit-code 0 \
                --no-progress \
                ${BACKEND_IMAGE}:${GIT_TAG}
            """
          }
        }
        stage('Scan Frontend') {
          steps {
            sh """
              docker run --rm \
                -v /var/run/docker.sock:/var/run/docker.sock \
                aquasec/trivy image \
                --severity HIGH,CRITICAL \
                --exit-code 0 \
                --no-progress \
                ${FRONTEND_IMAGE}:${GIT_TAG}
            """
          }
        }
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(
            credentialsId: 'DOCKER_HUB',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
          sh "docker push ${BACKEND_IMAGE}:${GIT_TAG}"
          sh "docker push ${BACKEND_IMAGE}:latest"
          sh "docker push ${FRONTEND_IMAGE}:${GIT_TAG}"
          sh "docker push ${FRONTEND_IMAGE}:latest"
        }
      }
    }

    stage('Deploy to Minikube') {
      steps {
        sh """
          kubectl config use-context minikube
          kubectl apply -f k8s/deployment.yaml
          kubectl set image deployment/ecommerce-backend \
            backend=${BACKEND_IMAGE}:${GIT_TAG}
          kubectl set image deployment/ecommerce-frontend \
            frontend=${FRONTEND_IMAGE}:${GIT_TAG}
          kubectl rollout status deployment/ecommerce-backend --timeout=120s
          kubectl rollout status deployment/ecommerce-frontend --timeout=120s
        """
      }
      post {
        failure {
          sh """
            kubectl rollout undo deployment/ecommerce-backend || true
            kubectl rollout undo deployment/ecommerce-frontend || true
          """
        }
      }
    }

  }

  post {
    success {
      echo "Deployed ${GIT_TAG} to Minikube!"
    }
    failure {
      echo "Pipeline FAILED for commit ${GIT_TAG}"
    }
    always {
      sh 'docker logout || true'
    }
  }
}