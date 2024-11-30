#!/bin/bash

# Verifica se os argumentos foram fornecidos
if [ "$#" -ne 2 ]; then
    echo "Uso: $0 <dia> <ano>"
    exit 1
fi

DAY=$1
YEAR=$2

# Adiciona todos os arquivos modificados ao staging
git add .

# Cria o commit com a mensagem especificada
git commit -m "Solution for the challenge of day $DAY of year $YEAR"