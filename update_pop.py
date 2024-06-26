from eyepop import EyePopSdk

import os
import asyncio
import logging
import time
import json
import aiofiles
import argparse as ap


def run(EYEPOP_POP_ID, EYEPOP_SECRET_KEY, EYEPOP_URL, logging_level=logging.ERROR):

    logging.basicConfig(level=logging_level)
    logging.getLogger('eyepop').setLevel(level=logging_level)

    with EyePopSdk.endpoint(pop_id=EYEPOP_POP_ID, secret_key=EYEPOP_SECRET_KEY, eyepop_url=EYEPOP_URL, is_async=False) as endpoint:

        manifest = endpoint.get_manifest()

        modelsLoaded = endpoint.list_models()

        popConfig = endpoint.get_pop_comp()

        print(
            manifest,
            '\n\n----------------\n\n',
            modelsLoaded,
            '\n\n----------------\n\n',
            popConfig
        )

        # set manifest for PARSeq
        manifest.append(
            {
                "authority": "PARSeq",
                "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/PARSeq/1.0.2/manifest.json",
            }
        )

        # set manifest for eyepop-text
        manifest.append(
            {
                "authority": "eyepop-text",
                "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/eptext/1.0.3/manifest.json",
            }
        )

        endpoint.set_manifest(manifest)

        # load PARSeq model
        inner_model_def = {
            'model_id': 'PARSeq:PARSeq',
            'dataset': 'TextDataset',
            'format': 'TorchScriptCuda',
            'type': 'float32'
        }

        endpoint.load_model(inner_model_def)

        # load eyepop-text model
        inner_model_def = {
            'model_id': 'eyepop-text:EPTextB1',
            'dataset': 'Text',
            'format': 'TorchScriptCuda',
            'type': 'float32'
        }

        endpoint.load_model(inner_model_def)

        endpoint.set_pop_comp(
            """
                ep_infer id=1 category-name="text"
                model=eyepop-text:EPTextB1_Text_TorchScriptCuda_float32 threshold=0.6
                ! ep_infer id=2 category-name="text"
                secondary-to-id=1
                model=PARSeq:PARSeq_TextDataset_TorchScriptCuda_float32 threshold=0.1
            """
        )


# EyePop SDK configuration
EYEPOP_POP_ID = '95581bc77b2b4ce498b95ed545b9e860'
EYEPOP_SECRET_KEY = 'AAGisBhdNU2Q8LGWTq4suaD2Z0FBQUFBQm1NOWN0NVVQX2JCWjNuazBMV0ctLTk1dzY2djVGeDVuZk43MmJ0bWlvNXpBN3VkeDhja1BOb1F5NWtxRnRheDB6emxCNzVJd3J6RGtnVXJocTdQcHJMenRxV2VmTmpwb3VEOUo1RkxoSTZ0bkZqUGM9'
EYEPOP_SAGING_URL = 'https://staging-api.eyepop.ai'
EYEPOP_URL = 'https://api.eyepop.ai'

args = ap.ArgumentParser()
args.add_argument("--pop", type=str, default=None)
args.add_argument("--key", type=str, default=None)
args.add_argument("--staging", action="store_true", default=True)
args = args.parse_args()

if args.pop:
    EYEPOP_POP_ID = args.pop
else:
    print("No pop id provided, using default.")

if args.key:
    EYEPOP_SECRET_KEY = args.key
else:
    print("No secret key provided, using default.")

if args.staging:
    EYEPOP_URL = EYEPOP_SAGING_URL

print(args)

run(EYEPOP_POP_ID, EYEPOP_SECRET_KEY, EYEPOP_URL)
