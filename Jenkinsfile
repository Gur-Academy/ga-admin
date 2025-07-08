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
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh "${MAVEN_HOME}/bin/mvn clean install -DskipTests"
            }
        }

        stage('Run Tests') {
            steps {
                sh "${MAVEN_HOME}/bin/mvn test"
            }
        }

        stage('Package') {
            steps {
                sh "${MAVEN_HOME}/bin/mvn package"
            }
        }

        stage('Notify PR Status') {
            steps {
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

    post {
        always {
            node('Built-In Node') {
                deleteDir()
            }
        }
    }
}
