pipeline {
    agent any

    environment {
        JAVA_HOME = tool 'jdk-21'
        MAVEN_HOME = tool 'maven3'
        PATH = "${JAVA_HOME}/bin:${env.PATH}"
        GITHUB_TOKEN = credentials('jenkins-cicd')
        REPO_OWNER = 'Gur-Academy'
        REPO_NAME = 'ga-admin'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Starting checkout...'
                checkout scm
                echo 'Checkout completed'
                sh 'pwd'
                sh 'ls -la'
            }
        }

        stage('Build') {
            steps {
                echo 'Starting build...'
                sh "${MAVEN_HOME}/bin/mvn clean install -DskipTests"
                echo 'Build completed'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Starting tests...'
                sh "${MAVEN_HOME}/bin/mvn test"
                echo 'Tests completed'
            }
        }

        stage('Package') {
            steps {
                echo 'Starting package...'
                sh "${MAVEN_HOME}/bin/mvn package"
                echo 'Package completed'
            }
        }

        stage('Notify PR Status') {
            steps {
                echo 'Starting PR notification...'
                script {
                    def commitSha = sh(
                        script: "git rev-parse HEAD",
                        returnStdout: true
                    ).trim()

                    def state = currentBuild.currentResult == 'SUCCESS' ? 'success' : 'failure'
                    def description = currentBuild.currentResult == 'SUCCESS' ? 'Build and Tests Passed' : 'Build or Tests Failed'
                    def context = 'Jenkins CI'

                    sh """
                    curl -s -X POST -H "Authorization: token ${GITHUB_TOKEN}" \\
                         -d '{
                              "state": "${state}",
                              "target_url": "${env.BUILD_URL}",
                              "description": "${description}",
                              "context": "${context}"
                              }' \\
                         https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/statuses/${commitSha}
                    """
                }
            }
        }
    }


}
